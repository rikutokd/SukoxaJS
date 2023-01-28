FROM gcr.io/google-appengine/nodejs

# Working directory is where files are stored, npm is installed, and the application is launched
WORKDIR /app

# Copy application to the /app directory.
# Add only the package.json before running 'npm install' so 'npm install' is not run if there are only code changes, no package changes
COPY package.json /app/package.json

RUN apt-get update
RUN apt-get upgrade
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x
RUN apt-get install -y nodejs

RUN apt-get install -y sox
RUN apt-get install pulseaudio -y
#setting pulse audio config
RUN mkdir -p etc/pulse
RUN touch etc/pulse/client.conf
RUN echo "default-server = tcp:localhost" >>etc/pulse/client.conf
RUN sed -i -e "/^ *#load-module module-native-protocol-tcp/c\       load-module module-native-protocol-tcp" /etc/pulse/default.pa

RUN npm install n -g && n 16.9.0
RUN npm install

COPY . /app

# Expose port so when the container is launched you can curl/see it.
EXPOSE 8080

# The command to execute when Docker image launches.
CMD ["npm", "start"]