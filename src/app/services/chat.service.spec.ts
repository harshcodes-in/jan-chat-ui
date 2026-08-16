import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/models').flush({ data: [] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should use the Angular proxy endpoint for Jan API requests', () => {
    expect((service as any).apiUrl).toBe('/api');
    service.setApiUrl('http://192.168.1.50:1337/v1');
    expect((service as any).apiUrl).toBe('/api');
  });

  it('should request a streamed chat completion', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(
      'data: {"choices":[{"delta":{"content":"Hello there!"}}],"usage":{"prompt_tokens":2,"completion_tokens":3,"total_tokens":5}}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    ));

    const promise = service.sendMessage('hello', 'test-model', 'You are helpful', 0.2, 256, []);

    await promise;

    expect(fetchSpy).toHaveBeenCalled();
    const [url, options] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
    expect(url).toBe('/api/chat/completions');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string).stream).toBeTrue();
  });

  it('should replace the last assistant message with a new object when streaming', () => {
    service.addMessage({
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now()
    });
    service.addMessage({
      id: '2',
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    });

    const before = service.getMessages();
    const originalLastMessage = before[before.length - 1];

    service.appendToLastMessage('Hi there');

    const after = service.getMessages();
    const updatedLastMessage = after[after.length - 1];

    expect(updatedLastMessage.content).toBe('Hi there');
    expect(updatedLastMessage).not.toBe(originalLastMessage);
  });

  it('should include the model thinking toggle in the streamed request payload', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(
      'data: {"choices":[{"delta":{"content":"Done"}}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    ));

    await service.sendMessage('hello', 'test-model', 'You are helpful', 0.2, 256, [], false);

    expect(fetchSpy).toHaveBeenCalled();
    const [, options] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.reasoning).toBeFalse();
    expect(body.enable_thinking).toBeFalse();
  });

  it('should keep reasoning content transient and strip it from model history payloads', () => {
    const messages: any[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Final answer', reasoningContent: 'Thinking...', timestamp: Date.now() }
    ];

    const payload = (service as any).toOpenAiMessages(messages, 'System prompt');

    expect(payload[0].role).toBe('system');
    expect(payload[1].content).toBe('Hello');
    expect(payload[2].content).toBe('Final answer');
    expect(JSON.stringify(payload)).not.toContain('Thinking...');
  });
});
