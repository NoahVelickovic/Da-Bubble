import { TestBed } from '@angular/core/testing';

import { GlobalChannelService } from './global-channel-service';

describe('GlobalChannelService', () => {
  let service: GlobalChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalChannelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
