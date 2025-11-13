import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-landing-page',
  imports: [RouterModule, CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})



export class LandingPage {
showIntro = true;

ngOnInit() {
  setTimeout(() => {
    this.showIntro = false;
  }, 3400);
}
}
