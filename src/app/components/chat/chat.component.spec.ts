import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { NgZone } from '@angular/core';

import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { StorageService } from '../../services/storage.service';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent],
      providers: [
        {
          provide: ChatService,
          useValue: {
            messages$: new BehaviorSubject([]),
            generating$: new BehaviorSubject(false),
            requestStatus$: new BehaviorSubject<'idle'>('idle'),
            connectionStatus$: new BehaviorSubject<'disconnected'>('disconnected'),
            setApiUrl: jasmine.createSpy('setApiUrl'),
            setCurrentModel: jasmine.createSpy('setCurrentModel'),
            checkConnection: jasmine.createSpy('checkConnection'),
            fetchModels: jasmine.createSpy('fetchModels').and.returnValue({ subscribe: () => undefined }),
            saveCurrentConversation: jasmine.createSpy('saveCurrentConversation')
          }
        },
        {
          provide: StorageService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue({
              theme: 'dark',
              temperature: 0.7,
              maxTokens: 2000,
              systemPrompt: 'You are a helpful AI assistant.',
              apiUrl: '/api',
              lanMode: false,
              selectedModelId: ''
            }),
            getCurrentConversationId: jasmine.createSpy('getCurrentConversationId').and.returnValue(null),
            saveSettings: jasmine.createSpy('saveSettings'),
            getConversation: jasmine.createSpy('getConversation').and.returnValue(null),
            getAllConversations: jasmine.createSpy('getAllConversations').and.returnValue([]),
            setCurrentConversation: jasmine.createSpy('setCurrentConversation'),
            clearCurrentConversation: jasmine.createSpy('clearCurrentConversation')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  it('should run connection checks inside Angular so OnPush status updates render', () => {
    const ngZone = TestBed.inject(NgZone);
    let pollCallback: (() => void) | undefined;

    spyOn(window, 'setInterval').and.callFake((callback: TimerHandler) => {
      pollCallback = callback as () => void;
      return 1 as any;
    });

    spyOn(ngZone, 'run').and.callThrough();

    component.ngOnInit();

    expect(pollCallback).toBeDefined();
    pollCallback!();

    expect(ngZone.run).toHaveBeenCalled();
    expect((TestBed.inject(ChatService) as any).checkConnection).toHaveBeenCalled();
  });
});
