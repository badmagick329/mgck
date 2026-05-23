from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import PasswordChangeDoneView, PasswordChangeView
from django.db.models import QuerySet
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse, reverse_lazy
from fileuploader.forms import StyledPasswordChangeForm, UploadedFileForm
from fileuploader.models import UploadedFile, UploadUser


@login_required(login_url=reverse_lazy("fileuploader:login"))
def upload_file(request):
    upload_user = get_upload_user(request)
    if upload_user is None:
        return render_file_manager(
            request,
            UploadedFileForm(),
            upload_user=None,
            error_message=(
                "You do not have permission to upload files. Please contact the admin."
            ),
            status=403,
        )

    if request.method == "POST":
        form = UploadedFileForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded = form.cleaned_data["file"]
            incoming_size = uploaded.size
            if not upload_user.can_store(incoming_size):
                return render_file_manager(
                    request,
                    form,
                    upload_user=upload_user,
                    error_message=(
                        "This upload exceeds your remaining storage quota."
                    ),
                    status=400,
                )
            instance = form.save(commit=False)
            instance.uploaded_by = request.user
            instance.original_name = uploaded.name
            instance.stored_size_bytes = incoming_size
            instance.content_type = uploaded.content_type or ""
            instance.save()
            messages.success(
                request,
                f"{instance.display_name} uploaded successfully.",
            )
            return HttpResponseRedirect(reverse("fileuploader:list_files"))
        else:
            return render_file_manager(
                request,
                form,
                upload_user=upload_user,
                error_message="Please fix the upload form errors below.",
                status=400,
            )
    return HttpResponseRedirect(reverse("fileuploader:list_files"))


@login_required(login_url=reverse_lazy("fileuploader:login"))
def list_files(request):
    upload_user = get_upload_user(request)
    if upload_user is None:
        return render_file_manager(
            request,
            UploadedFileForm(),
            upload_user=None,
            error_message=(
                "You do not have permission to upload files. Please contact the admin."
            ),
            status=403,
        )

    return render_file_manager(
        request,
        UploadedFileForm(),
        upload_user=upload_user,
    )


@login_required(login_url=reverse_lazy("fileuploader:login"))
def delete_file(request, file_id):
    if get_upload_user(request) is None:
        return HttpResponse(status=403)
    file_to_delete = get_object_or_404(
        request.user.uploaded_files, pk=file_id, uploaded_by=request.user
    )
    filename = file_to_delete.display_name
    file_to_delete.delete()
    messages.success(request, f"{filename} deleted successfully.")
    return HttpResponseRedirect(reverse("fileuploader:list_files"))


def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("fileuploader:upload_file"))
        else:
            return render(
                request,
                "registration/login.html",
                {"message": "Invalid username and/or password."},
            )
    else:
        return render(
            request,
            "registration/login.html",
            {"action": reverse("fileuploader:login")},
        )


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("fileuploader:login"))


class FileUploaderPasswordChangeView(LoginRequiredMixin, PasswordChangeView):
    form_class = StyledPasswordChangeForm
    template_name = "fileuploader/password_change.html"
    success_url = reverse_lazy("fileuploader:password_change_done")
    login_url = reverse_lazy("fileuploader:login")


class FileUploaderPasswordChangeDoneView(LoginRequiredMixin, PasswordChangeDoneView):
    template_name = "fileuploader/password_change_done.html"
    login_url = reverse_lazy("fileuploader:login")


def render_file_manager(
    request,
    form: UploadedFileForm,
    upload_user: UploadUser | None,
    error_message: str | None = None,
    status: int = 200,
):
    files: QuerySet[UploadedFile] = request.user.uploaded_files.all().order_by("-uploaded_at")
    if upload_user is None:
        files = UploadedFile.objects.none()

    return render(
        request,
        "fileuploader/list.html",
        {
            "form": form,
            "upload_user": upload_user,
            "files": files,
            "error_message": error_message,
        },
        status=status,
    )


def get_upload_user(request) -> UploadUser | None:
    upload_user = (
        UploadUser.objects.filter(user=request.user).select_related("user").first()
    )
    if upload_user is not None:
        return upload_user

    if request.user.is_superuser:
        return UploadUser(
            user=request.user,
            is_unlimited=True,
            storage_quota_bytes=0,
        )

    return None
