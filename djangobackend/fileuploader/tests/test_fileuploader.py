import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse

from fileuploader.admin import UploadUserAdminForm
from fileuploader.models import UploadedFile, UploadUser


class FileUploaderTests(TestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media_root)
        self.override.enable()

        self.password = "password123"
        self.user = User.objects.create_user(
            username="member",
            password=self.password,
        )
        self.unlimited_user = User.objects.create_user(
            username="admin_member",
            password=self.password,
        )
        self.other_user = User.objects.create_user(
            username="other_member",
            password=self.password,
        )
        self.superuser = User.objects.create_superuser(
            username="admin",
            password=self.password,
            email="admin@example.com",
        )

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.media_root, ignore_errors=True)

    def login(self, user: User | None = None):
        user = user or self.user
        self.client.login(username=user.username, password=self.password)

    def test_upload_routes_require_login(self):
        response = self.client.get(reverse("fileuploader:list_files"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("fileuploader:login"), response.url)

    def test_password_change_route_requires_login(self):
        response = self.client.get(reverse("fileuploader:password_change"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("fileuploader:login"), response.url)

    def test_user_without_upload_access_sees_clear_message(self):
        self.login()
        response = self.client.get(reverse("fileuploader:list_files"))
        self.assertEqual(response.status_code, 403)
        self.assertContains(
            response,
            "You do not have permission to upload files",
            status_code=403,
        )

    def test_superuser_has_unlimited_uploader_access_without_upload_user_record(self):
        self.login(self.superuser)
        response = self.client.get(reverse("fileuploader:list_files"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Unlimited")
        self.assertNotContains(
            response,
            "You do not have permission to upload files",
        )

    def test_upload_within_quota_succeeds_and_persists_metadata(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=10)
        self.login()

        response = self.client.post(
            reverse("fileuploader:upload_file"),
            {
                "file": SimpleUploadedFile(
                    "greeting.txt",
                    b"hello",
                    content_type="text/plain",
                )
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "uploaded successfully")
        uploaded_file = UploadedFile.objects.get(uploaded_by=self.user)
        self.assertEqual(uploaded_file.original_name, "greeting.txt")
        self.assertEqual(uploaded_file.stored_size_bytes, 5)
        self.assertEqual(uploaded_file.content_type, "text/plain")
        self.assertTrue(uploaded_file.file.name.startswith("fileuploader/member/"))
        self.assertTrue(uploaded_file.file.storage.exists(uploaded_file.file.name))
        self.assertContains(response, "greeting.txt")
        self.assertContains(response, uploaded_file.file.url)

    def test_upload_exceeding_quota_is_rejected(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=4)
        self.login()

        response = self.client.post(
            reverse("fileuploader:upload_file"),
            {
                "file": SimpleUploadedFile(
                    "too-big.txt",
                    b"hello",
                    content_type="text/plain",
                )
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertContains(
            response,
            "This upload exceeds your remaining storage quota.",
            status_code=400,
        )
        self.assertEqual(UploadedFile.objects.count(), 0)

    def test_ajax_upload_returns_json_success_payload(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=10)
        self.login()

        response = self.client.post(
            reverse("fileuploader:upload_file"),
            {
                "file": SimpleUploadedFile(
                    "ajax.txt",
                    b"hello",
                    content_type="text/plain",
                )
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["redirect_url"], reverse("fileuploader:list_files"))
        self.assertIn("uploaded successfully", response.json()["message"])

    def test_ajax_upload_quota_error_returns_json(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=4)
        self.login()

        response = self.client.post(
            reverse("fileuploader:upload_file"),
            {
                "file": SimpleUploadedFile(
                    "too-big.txt",
                    b"hello",
                    content_type="text/plain",
                )
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error_message"],
            "This upload exceeds your remaining storage quota.",
        )

    def test_unlimited_user_bypasses_quota(self):
        UploadUser.objects.create(
            user=self.unlimited_user,
            is_unlimited=True,
            storage_quota_bytes=1,
        )
        self.login(self.unlimited_user)

        response = self.client.post(
            reverse("fileuploader:upload_file"),
            {
                "file": SimpleUploadedFile(
                    "big.txt",
                    b"hello world",
                    content_type="text/plain",
                )
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(UploadedFile.objects.filter(uploaded_by=self.unlimited_user).count(), 1)

    def test_password_change_updates_password_and_keeps_user_logged_in(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=20)
        self.login()
        new_password = "new-password-456"

        response = self.client.post(
            reverse("fileuploader:password_change"),
            {
                "old_password": self.password,
                "new_password1": new_password,
                "new_password2": new_password,
            },
            follow=True,
        )

        self.user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Password Updated")
        self.assertTrue(self.user.check_password(new_password))
        self.assertEqual(
            int(self.client.session["_auth_user_id"]),
            self.user.id,
        )

    def test_delete_removes_database_record_and_file(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=10)
        self.login()
        uploaded_file = UploadedFile.objects.create(
            uploaded_by=self.user,
            file=SimpleUploadedFile("delete-me.txt", b"bye"),
            original_name="delete-me.txt",
            stored_size_bytes=3,
            content_type="text/plain",
        )
        stored_name = uploaded_file.file.name
        self.assertTrue(uploaded_file.file.storage.exists(stored_name))

        response = self.client.post(
            reverse("fileuploader:delete_file", args=[uploaded_file.id]),
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(UploadedFile.objects.filter(id=uploaded_file.id).exists())
        self.assertFalse(uploaded_file.file.storage.exists(stored_name))

    def test_file_list_only_shows_users_own_files(self):
        UploadUser.objects.create(user=self.user, storage_quota_bytes=20)
        UploadUser.objects.create(user=self.other_user, storage_quota_bytes=20)
        UploadedFile.objects.create(
            uploaded_by=self.user,
            file=SimpleUploadedFile("mine.txt", b"me"),
            original_name="mine.txt",
            stored_size_bytes=2,
            content_type="text/plain",
        )
        UploadedFile.objects.create(
            uploaded_by=self.other_user,
            file=SimpleUploadedFile("theirs.txt", b"them"),
            original_name="theirs.txt",
            stored_size_bytes=4,
            content_type="text/plain",
        )

        self.login()
        response = self.client.get(reverse("fileuploader:list_files"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "mine.txt")
        self.assertNotContains(response, "theirs.txt")

    def test_admin_form_converts_friendly_quota_to_bytes(self):
        form = UploadUserAdminForm(
            data={
                "user": self.user.id,
                "is_unlimited": False,
                "quota_value": 5,
                "quota_unit": "GB",
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        upload_user = form.save()
        self.assertEqual(upload_user.storage_quota_bytes, 5 * 1024 * 1024 * 1024)

    def test_admin_form_sets_zero_quota_for_unlimited_users(self):
        form = UploadUserAdminForm(
            data={
                "user": self.user.id,
                "is_unlimited": True,
                "quota_value": "",
                "quota_unit": "",
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        upload_user = form.save()
        self.assertTrue(upload_user.is_unlimited)
        self.assertEqual(upload_user.storage_quota_bytes, 0)
