# Installing scikit-learn requires gcc, so going with this base image is the easiest option.
FROM python:3.12-bookworm
WORKDIR /usr/apps/chunk-func

COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN addgroup --gid 4711 appuser && adduser --uid 4711 --ingroup appuser appuser
USER 4711:4711

COPY ./bayesian_optimizer ./bayesian_optimizer

EXPOSE 9000
CMD [ "python", "./bayesian_optimizer/main.py" ]
