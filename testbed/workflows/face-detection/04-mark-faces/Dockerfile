FROM python:3.12-slim-bookworm
WORKDIR /usr/apps/mark-faces

RUN apt-get update && apt-get install -y libgl1 libgl1-mesa-glx libglib2.0-0 && apt-get clean

COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./ ./

EXPOSE 8080
CMD [ "./app.sh" ]
