#!/bin/bash
# set -x

FUNC_URL="http://localhost:8080"

REQ_BODY='
    {
        "url": "http://192.168.65.254:9002",
        "user": "u16pZBqp2VTe3dNYLYRt",
        "password": "zr5VScnJzqTZggRrH7nPr0dFnUwOdTPBbMBwuLFQ",
        "bucket": "logs",
        "objectKey": "scheduler-scalability-jobs-15.log",
        "objectSizeBytes": 100449280
    }
'

for i in {1..5}
do
    echo "Request $i"
    curl -X POST -H "Content-Type: application/json" $FUNC_URL -d "$REQ_BODY"
    echo ""
done
