import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidatorFn  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

export function numbersOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const regex = /^[0-9]+$/;
    if (!regex.test(control.value)) {
      return { 'numbersOnly': true };
    }
    return null;
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, HttpClientModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy{
  searchForm: FormGroup;
  searchResults$!: Observable<any>;
  private valueChangesSubscription: Subscription | undefined;

  constructor(private formBuilder: FormBuilder, private http: HttpClient) {
    this.searchForm = this.formBuilder.group({
      query: ['', [numbersOnlyValidator()]]
    });
  }

  ngOnInit(): void {
    this.searchResults$ = this.searchForm.get('query')!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((query: string) => this.performSearch(query))
    );

    this.valueChangesSubscription = this.searchForm.get('query')!.valueChanges.subscribe(value => {
      if (value === '') {
        this.clearQueryErrorsAndReset()
      }
    });
  }

  clearQueryErrorsAndReset() {
    const queryControl = this.searchForm.get('query');
    if (queryControl && queryControl.errors && queryControl.errors['numbersOnly']) {
      queryControl.setErrors(null);
    }
    queryControl?.reset();
  }

  performSearch(query: string): Observable<any> {
    if (!isNaN(Number(query)) && query !== '') {
      return this.http.get<any>(`https://rickandmortyapi.com/api/character/${query}`)
    } else {
      return of(null);
    }
  }

  hasNumbersOnlyError() {
    const queryControl = this.searchForm.get('query');
    return queryControl && queryControl.errors && queryControl.errors['numbersOnly'] && queryControl.dirty;
  }

  ngOnDestroy(): void {
    if (this.valueChangesSubscription) {
      this.valueChangesSubscription.unsubscribe();
    }
  }
}
