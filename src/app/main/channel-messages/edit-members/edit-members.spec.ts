import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMembers } from './edit-members';

describe('EditMembers', () => {
  let component: EditMembers;
  let fixture: ComponentFixture<EditMembers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMembers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMembers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
