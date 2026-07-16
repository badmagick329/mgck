# https://hub.docker.com/_/microsoft-dotnet
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# copy the production project and restore as distinct layers
COPY CoreApi.WebApi/*.csproj ./CoreApi.WebApi/
RUN dotnet restore CoreApi.WebApi/CoreApi.WebApi.csproj

# copy everything else and build app
COPY CoreApi.WebApi/. ./CoreApi.WebApi/
WORKDIR /source/CoreApi.WebApi
RUN dotnet publish CoreApi.WebApi.csproj -c release -o /app --no-restore

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app ./
ENV ASPNETCORE_URLS=http://*:5010
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "CoreApi.WebApi.dll"]
