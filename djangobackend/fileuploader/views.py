from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from fileuploader.forms import UploadedFileForm
from fileuploader.models import UploadUser


@login_required(login_url="login/")
def upload_file(request):
    if (
        not UploadUser.objects.filter(user=request.user).exists()
    ):
        return HttpResponse(
            "<h1>You do not have permission to upload files. Please contact the admin</h1>"
        )
    if request.method == "POST":
        form = UploadedFileForm(request.POST, request.FILES)
        if form.is_valid():
            instance = form.save(commit=False)
            instance.uploaded_by = request.user
            instance.save()
            return render(
                request,
                "fileuploader/success.html",
                {"filename": instance.file.name, "file_url": instance.file.url},
            )
        else:
            return render(
                request,
                "fileuploader/upload.html",
                {"form": form, "errors": form.errors},
            )
    else:
        return render(
            request, "fileuploader/upload.html", {"form": UploadedFileForm()}
        )


@login_required(login_url="login/")
def list_files(request):
    user_files = request.user.uploaded_files.all()
    return render(
        request,
        "fileuploader/list.html",
        {"files": user_files},
    )


@login_required(login_url="login/")
def delete_file(request, file_id):
    file_to_delete = get_object_or_404(
        request.user.uploaded_files, pk=file_id, uploaded_by=request.user
    )
    file_to_delete.delete()
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
        return render(request, "registration/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("fileuploader:login"))
