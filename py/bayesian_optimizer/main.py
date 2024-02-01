import logging
from concurrent.futures import ThreadPoolExecutor

import grpc

from pb.bayesian_optimizer_pb2_grpc import  add_BayesianOptimizerServiceServicer_to_server
from bayesian_optimizer_server import BayesianOptimizerServer


# The port, where the server is going to listen.
PORT = 9000

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
	)
    server = grpc.server(ThreadPoolExecutor(10))
    add_BayesianOptimizerServiceServicer_to_server(BayesianOptimizerServer(), server)
    server.add_insecure_port(f'[::]:{PORT}')
    server.start()
    logging.info('BayesianOptimizerServer ready on port %r', PORT)
    server.wait_for_termination()
