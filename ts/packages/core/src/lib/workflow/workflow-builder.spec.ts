import { ProfilingSessionResults, WorkflowDescription, WorkflowStepType } from '../model';
import { WorkflowBuilder } from './workflow-builder';

describe('WorkflowBuilder', () => {

    let builder: WorkflowBuilder;

    function getLinearWorkflow(): WorkflowDescription {
        return {
            name: 'test',
            startStep: 'one',
            endStep: 'four',
            steps: [
                {
                    name: 'one',
                    type: WorkflowStepType.Function,
                    successors: [ 'two' ],
                    profilingResults: { results: [] } as any,
                },
                {
                    name: 'two',
                    type: WorkflowStepType.Function,
                    successors: [ 'three' ],
                    profilingResults: { results: [] } as any,
                },
                {
                    name: 'three',
                    type: WorkflowStepType.Function,
                    successors: [ 'four' ],
                    profilingResults: { results: [] } as any,
                },
                {
                    name: 'four',
                    type: WorkflowStepType.Function,
                    profilingResults: { results: [] } as any,
                },
            ],
            availableResourceProfiles: [],
        };
    }

    function getParallelWorkflow(): WorkflowDescription {
        return {
            name: 'test',
            startStep: 'one',
            endStep: 'four',
            steps: [
                {
                    name: 'one',
                    type: WorkflowStepType.Function,
                    successors: [ 'two', 'three' ],
                    profilingResults: { results: [] } as any,
                },
                {
                    name: 'two',
                    type: WorkflowStepType.Function,
                    successors: [ 'four' ],
                    profilingResults: { results: [] } as any,
                },
                {
                    name: 'three',
                    type: WorkflowStepType.Function,
                    successors: [ 'four' ],
                    profilingResults: { results: [] } as any,
                },
                {
                    name: 'four',
                    type: WorkflowStepType.Function,
                    profilingResults: { results: [] } as any,
                },
            ],
            availableResourceProfiles: [],
        };
    }


    beforeEach(() => {
        builder = new WorkflowBuilder();
    });

    it('connects linear steps properly', () => {
        const workflowDesc = getLinearWorkflow();
        const workflow = builder.buildWorkflow(workflowDesc);
        const workflowGraph = workflow.graph;

        expect(workflow.name).toEqual(workflowDesc.name);

        expect(workflowGraph.start.name).toEqual(workflowDesc.startStep);
        expect(workflowGraph.end.name).toEqual(workflowDesc.endStep);
        expect(Object.keys(workflowGraph.steps).length).toEqual(4);

        const stepOne = workflowGraph.steps['one'];
        expect(stepOne).not.toBeUndefined();
        expect(stepOne.requiredInputs).toBeFalsy();
        expect(stepOne.possibleSuccessors).toEqual([ 'two' ]);

        const stepTwo = workflowGraph.steps['two'];
        expect(stepTwo).not.toBeUndefined();
        expect(stepTwo.requiredInputs).toEqual([ 'one' ])
        expect(stepTwo.possibleSuccessors).toEqual([ 'three' ]);

        const stepThree = workflowGraph.steps['three'];
        expect(stepThree).not.toBeUndefined();
        expect(stepThree.requiredInputs).toEqual([ 'two' ])
        expect(stepThree.possibleSuccessors).toEqual([ 'four' ]);

        const stepFour = workflowGraph.steps['four'];
        expect(stepFour).not.toBeUndefined();
        expect(stepFour.requiredInputs).toEqual([ 'three' ])
        expect(stepFour.possibleSuccessors).toBeFalsy();
    });

    it('builds a linear graphology graph', () => {
        const workflowDesc = getLinearWorkflow();
        const workflow = builder.buildWorkflow(workflowDesc);
        const steps = workflow.graph.steps;
        const graph = workflow.graph.graph;

        expect(graph).toBeTruthy();
        expect(graph.nodes().length).toEqual(4);
        expect(graph.edges().length).toEqual(3);

        expect(graph.getNodeAttributes('one')).toEqual({ step: steps['one'] });
        const stepOneInEdges = graph.inboundEdges('one');
        expect(stepOneInEdges.length).toEqual(0);
        const stepOneOutEdges = graph.outboundEdges('one');
        expect(stepOneOutEdges.length).toEqual(1);
        expect(graph.isDirected(stepOneOutEdges[0])).toBe(true);
        expect(graph.source(stepOneOutEdges[0])).toEqual('one');
        expect(graph.target(stepOneOutEdges[0])).toEqual('two');

        expect(graph.getNodeAttributes('two')).toEqual({ step: steps['two'] });
        const stepTwoInEdges = graph.inboundEdges('two');
        expect(stepTwoInEdges).toEqual(stepOneOutEdges);
        const stepTwoOutEdges = graph.outboundEdges('two');
        expect(stepTwoOutEdges.length).toEqual(1);
        expect(graph.isDirected(stepTwoOutEdges[0])).toBe(true);
        expect(graph.source(stepTwoOutEdges[0])).toEqual('two');
        expect(graph.target(stepTwoOutEdges[0])).toEqual('three');

        expect(graph.getNodeAttributes('three')).toEqual({ step: steps['three'] });
        const stepThreeInEdges = graph.inboundEdges('three');
        expect(stepThreeInEdges).toEqual(stepTwoOutEdges);
        const stepThreeOutEdges = graph.outboundEdges('three');
        expect(stepThreeOutEdges.length).toEqual(1);
        expect(graph.isDirected(stepThreeOutEdges[0])).toBe(true);
        expect(graph.source(stepThreeOutEdges[0])).toEqual('three');
        expect(graph.target(stepThreeOutEdges[0])).toEqual('four');

        expect(graph.getNodeAttributes('four')).toEqual({ step: steps['four'] });
        const stepFourInEdges = graph.inboundEdges('four');
        expect(stepFourInEdges).toEqual(stepThreeOutEdges);
        const stepFourOutEdges = graph.outboundEdges('four');
        expect(stepFourOutEdges.length).toEqual(0);
    });

    it('connects parallel steps properly', () => {
        const workflowDesc = getParallelWorkflow();
        const workflow = builder.buildWorkflow(workflowDesc);
        const workflowGraph = workflow.graph;

        expect(workflow.name).toEqual(workflowDesc.name);

        expect(workflowGraph.start.name).toEqual(workflowDesc.startStep);
        expect(workflowGraph.end.name).toEqual(workflowDesc.endStep);
        expect(Object.keys(workflowGraph.steps).length).toEqual(4);

        const stepOne = workflowGraph.steps['one'];
        expect(stepOne).not.toBeUndefined();
        expect(stepOne.requiredInputs).toBeFalsy();
        expect(stepOne.possibleSuccessors).toEqual([ 'two', 'three' ]);

        const stepTwo = workflowGraph.steps['two'];
        expect(stepTwo).not.toBeUndefined();
        expect(stepTwo.requiredInputs).toEqual([ 'one' ])
        expect(stepTwo.possibleSuccessors).toEqual([ 'four' ]);

        const stepThree = workflowGraph.steps['three'];
        expect(stepThree).not.toBeUndefined();
        expect(stepThree.requiredInputs).toEqual([ 'one' ])
        expect(stepThree.possibleSuccessors).toEqual([ 'four' ]);

        const stepFour = workflowGraph.steps['four'];
        expect(stepFour).not.toBeUndefined();
        expect(stepFour.requiredInputs).toEqual([ 'two', 'three' ])
        expect(stepFour.possibleSuccessors).toBeFalsy();
    });

    it('builds a parallel graphology graph', () => {
        const workflowDesc = getParallelWorkflow();
        const workflow = builder.buildWorkflow(workflowDesc);
        const steps = workflow.graph.steps;
        const graph = workflow.graph.graph;

        expect(graph).toBeTruthy();
        expect(graph.nodes().length).toEqual(4);
        expect(graph.edges().length).toEqual(4);

        expect(graph.getNodeAttributes('one')).toEqual({ step: steps['one'] });
        const stepOneInEdges = graph.inboundEdges('one');
        expect(stepOneInEdges.length).toEqual(0);
        const stepOneOutEdges = graph.outboundEdges('one');
        expect(stepOneOutEdges.length).toEqual(2);
        expect(graph.isDirected(stepOneOutEdges[0])).toBe(true);
        expect(graph.source(stepOneOutEdges[0])).toEqual('one');
        expect(graph.target(stepOneOutEdges[0])).toEqual('two');
        expect(graph.isDirected(stepOneOutEdges[1])).toBe(true);
        expect(graph.source(stepOneOutEdges[1])).toEqual('one');
        expect(graph.target(stepOneOutEdges[1])).toEqual('three');

        expect(graph.getNodeAttributes('two')).toEqual({ step: steps['two'] });
        const stepTwoInEdges = graph.inboundEdges('two');
        expect(stepTwoInEdges).toEqual([ stepOneOutEdges[0] ]);
        const stepTwoOutEdges = graph.outboundEdges('two');
        expect(stepTwoOutEdges.length).toEqual(1);
        expect(graph.isDirected(stepTwoOutEdges[0])).toBe(true);
        expect(graph.source(stepTwoOutEdges[0])).toEqual('two');
        expect(graph.target(stepTwoOutEdges[0])).toEqual('four');

        expect(graph.getNodeAttributes('three')).toEqual({ step: steps['three'] });
        const stepThreeInEdges = graph.inboundEdges('three');
        expect(stepThreeInEdges).toEqual([ stepOneOutEdges[1] ]);
        const stepThreeOutEdges = graph.outboundEdges('three');
        expect(stepThreeOutEdges.length).toEqual(1);
        expect(graph.isDirected(stepThreeOutEdges[0])).toBe(true);
        expect(graph.source(stepThreeOutEdges[0])).toEqual('three');
        expect(graph.target(stepThreeOutEdges[0])).toEqual('four');

        expect(graph.getNodeAttributes('four')).toEqual({ step: steps['four'] });
        const stepFourInEdges = graph.inboundEdges('four');
        expect(stepFourInEdges).toEqual([ stepTwoOutEdges[0], stepThreeOutEdges[0] ]);
        const stepFourOutEdges = graph.outboundEdges('four');
        expect(stepFourOutEdges.length).toEqual(0);
    });
});
