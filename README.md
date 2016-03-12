# ngrx-store-logger
Advanced logging for @ngrx/store applications, inspired by [redux-logger](https://github.com/fcomb/redux-logger).

## Dependencies
`ngrx-store-logger` depends on [@ngrx/store](https://github.com/ngrx/store) and [Angular 2](https://github.com/angular/angular).

## Usage
```bash
npm install ngrx-store-logger --save
```

1. Configure your ngrx store as normal using `provideStore`. 
2. Using the provided `loggerMiddleware` function, specify option overrides if applicable.

```ts
import {bootstrap} from 'angular2/platform/browser';
import {TodoApp} from './todo-app';
import {provideStore} from "@ngrx/store";
import {loggerMiddleware} from "ngrx-store-logger";

export function main() {
  return bootstrap(TodoApp, [
      provideStore({todos, visibilityFilter}),
      ...loggerMiddleware()
  ])
  .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', main);
```

## API
### `loggerMiddleware(options? = {})`
Override appropriate options (more soon)

#### Arguments
* `options` \(*Object{}*): Loggers options to override