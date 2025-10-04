import { Workflow, WorkflowNode, WorkflowEdge, IOConfigFactory } from '../models';

export class WorkflowSampleGenerator {
  static createYouTubeSummarizerWorkflow(): Workflow {
    const workflow = new Workflow(
      'youtube-summarizer-sample',
      'YouTube Summarizer',
      [],
      []
    );

    // Create nodes with I/O configuration
    const inputNode = new WorkflowNode(
      'input',
      'interrupt',
      { x: 100, y: 100 },
      {
        label: 'YouTube URL Input',
        description: 'Input node for YouTube URL',
        ioConfig: {
          inputs: {
            string: {
              id: 'string',
              name: 'Input String',
              dataType: 'string',
              value: '',
              connectedTo: '$interrupt.string'
            }
          },
          outputs: {
            value: {
              id: 'value',
              name: 'Value',
              dataType: 'string'
            }
          }
        }
      }
    );

    const youtubeToolNode = new WorkflowNode(
      'youtube_tool',
      'tool',
      { x: 300, y: 100 },
      {
        label: 'YouTube Transcript Extractor',
        description: 'Extracts transcript from YouTube video',
        ioConfig: {
          inputs: {
            video_url: {
              id: 'video_url',
              name: 'Video URL',
              dataType: 'string',
              connectedTo: '$input.value'
            },
            api_key: {
              id: 'api_key',
              name: 'API Key',
              dataType: 'string',
              value: '$config.youtube_api_key',
              isTemplate: true
            }
          },
          outputs: {
            transcript: {
              id: 'transcript',
              name: 'Transcript',
              dataType: 'string'
            }
          }
        }
      }
    );

    const llmNode = new WorkflowNode(
      'llm',
      'llm',
      { x: 500, y: 100 },
      {
        label: 'LLM Summarizer',
        description: 'Summarizes the transcript using LLM',
        ioConfig: {
          inputs: {
            api_key: {
              id: 'api_key',
              name: 'API Key',
              dataType: 'string',
              value: '$config.llm_api_key',
              isTemplate: true
            },
            model: {
              id: 'model',
              name: 'Model',
              dataType: 'string',
              value: '$config.llm_model',
              isTemplate: true
            },
            system_prompt: {
              id: 'system_prompt',
              name: 'System Prompt',
              dataType: 'string',
              value: 'You are a helpful assistant that summarizes YouTube transcripts.'
            },
            user_prompt: {
              id: 'user_prompt',
              name: 'User Prompt',
              dataType: 'string',
              value: 'Summarize the following transcript:'
            },
            context: {
              id: 'context',
              name: 'Context',
              dataType: 'string',
              connectedTo: '$youtube_tool.transcript'
            }
          },
          outputs: {
            summary: {
              id: 'summary',
              name: 'Summary',
              dataType: 'string'
            }
          }
        }
      }
    );

    const startNode = new WorkflowNode(
      'start',
      'start',
      { x: 0, y: 100 },
      {
        label: 'Start',
        description: 'Workflow start point'
      }
    );

    const endNode = new WorkflowNode(
      'end',
      'end',
      { x: 700, y: 100 },
      {
        label: 'End',
        description: 'Workflow end point'
      }
    );

    // Add nodes to workflow
    workflow.addNode(startNode);
    workflow.addNode(inputNode);
    workflow.addNode(youtubeToolNode);
    workflow.addNode(llmNode);
    workflow.addNode(endNode);

    // Create edges
    const startToInput = new WorkflowEdge(
      'start-to-input',
      'start',
      'input',
      'default',
      { label: '' }
    );

    const inputToYoutube = new WorkflowEdge(
      'input-to-youtube',
      'input',
      'youtube_tool',
      'conditional',
      { 
        label: 'If not exit',
        condition: 'input.value != "exit"'
      }
    );

    const inputToEnd = new WorkflowEdge(
      'input-to-end',
      'input',
      'end',
      'default',
      { label: 'Default to end' }
    );

    const youtubeToLlm = new WorkflowEdge(
      'youtube-to-llm',
      'youtube_tool',
      'llm',
      'default',
      { label: '' }
    );

    const llmToInput = new WorkflowEdge(
      'llm-to-input',
      'llm',
      'input',
      'default',
      { label: 'Loop back' }
    );

    // Add edges to workflow
    workflow.addEdge(startToInput);
    workflow.addEdge(inputToYoutube);
    workflow.addEdge(inputToEnd);
    workflow.addEdge(youtubeToLlm);
    workflow.addEdge(llmToInput);

    return workflow;
  }

  static createSimpleAPIWorkflow(): Workflow {
    const workflow = new Workflow(
      'simple-api-workflow',
      'Simple API Workflow',
      [],
      []
    );

    const startNode = new WorkflowNode(
      'start',
      'start',
      { x: 100, y: 100 },
      {
        label: 'Start',
        description: 'Start the workflow'
      }
    );

    const apiNode = new WorkflowNode(
      'api_call',
      'tool',
      { x: 300, y: 100 },
      {
        label: 'API Call',
        description: 'Make an API request',
        ioConfig: {
          inputs: {
            endpoint: {
              id: 'endpoint',
              name: 'API Endpoint',
              dataType: 'string',
              value: 'https://api.example.com/data'
            },
            method: {
              id: 'method',
              name: 'HTTP Method',
              dataType: 'string',
              value: 'GET'
            }
          },
          outputs: {
            response: {
              id: 'response',
              name: 'Response',
              dataType: 'object'
            },
            status_code: {
              id: 'status_code',
              name: 'Status Code',
              dataType: 'number'
            }
          }
        }
      }
    );

    const endNode = new WorkflowNode(
      'end',
      'end',
      { x: 500, y: 100 },
      {
        label: 'End',
        description: 'End the workflow'
      }
    );

    workflow.addNode(startNode);
    workflow.addNode(apiNode);
    workflow.addNode(endNode);

    const startToApi = new WorkflowEdge(
      'start-to-api',
      'start',
      'api_call',
      'default',
      { label: '' }
    );

    const apiToEnd = new WorkflowEdge(
      'api-to-end',
      'api_call',
      'end',
      'default',
      { label: '' }
    );

    workflow.addEdge(startToApi);
    workflow.addEdge(apiToEnd);

    return workflow;
  }
}