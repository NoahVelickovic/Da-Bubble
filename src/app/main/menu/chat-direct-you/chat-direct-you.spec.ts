import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatDirectYou } from './chat-direct-you';

describe('ChatDirectYou', () => {
  let component: ChatDirectYou;
  let fixture: ComponentFixture<ChatDirectYou>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatDirectYou]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatDirectYou);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
