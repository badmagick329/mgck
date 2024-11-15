# https://hub.docker.com/_/microsoft-dotnet
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# copy csproj and restore as distinct layers
COPY *.sln .
COPY UserAuth/*.csproj ./UserAuth/
RUN dotnet restore

# copy everything else and build app
COPY UserAuth/. ./UserAuth/
WORKDIR /source/UserAuth
RUN dotnet publish -c release -o /app

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app ./
ENV ASPNETCORE_URLS http://*:5010
ENV ASPNETCORE_ENVIRONMENT Production
ENTRYPOINT ["dotnet", "UserAuth.dll"]
