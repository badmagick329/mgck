from django.http import HttpResponse
from django.shortcuts import render
from fileuploader.models import UploadedFile


def upload_file(request):
    if request.method == "POST":
        files = request.FILES.getlist("file_field")
        for f in files:
            print(f.name)
            print(f.size)
            print(f.content_type)
            print(f.charset)
            uploaded_file = UploadedFile(file=f)
            uploaded_file.save()
        return HttpResponse("File uploaded successfully")
    else:
        return HttpResponse("GET request not allowed", status=405)
