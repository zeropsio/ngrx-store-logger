# ngrx-store-logger
Advanced logging for @ngrx/store applications, ported from [redux-logger](https://github.com/fcomb/redux-logger).

![ngrx-store-logger](http://imgur.com/Fm2qfb5.png)

## Dependencies
`ngrx-store-logger` depends on [@ngrx/store](https://github.com/ngrx/store) and [Angular 2](https://github.com/angular/angular).

## Usage
```bash
npm install ngrx-store-logger --save
```

1. Configure your ngrx store as normal using `provideStore`. 
2. Using the provided `loggerMiddleware` function, specify option overrides.

```ts
import {bootstrap} from 'angular2/platform/browser';
import {TodoApp} from './todo-app';
import {provideStore} from "@ngrx/store";
import {loggerMiddleware} from "ngrx-store-logger";

export function main() {
  return bootstrap(TodoApp, [
      provideStore({todos, visibilityFilter}),
      //taking all defaults
      ...loggerMiddleware()
  ])
  .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', main);
```

## API
### `loggerMiddleware(options : LoggerOptions  = {})`
Initializes logger middleware with appropriate options (logical defaults if no options supplied)

#### Arguments
* `options` \(*Object*): Loggers options available

##### Options

``` ts
interface LoggerOptions {
    level? : 'log' | 'console' | 'warn' | 'error' | 'info', //default log
    collapsed? : boolean, //Should log group be collapsed? default: false
    duration? : boolean, //Print duration with action? default: false
    timestamp? : boolean, //Print timestamp with action? default: true
    stateTransformer? : (state : Object) => Object, //Transform state before print default: state => state
    actionTransformer? : (actn : Object) => Object, //Transform action before print default: actn => actn
    colors? : {
        title: (action : Object) => string,
        prevState: (prevState : Object) => string,
        action: (action: Object) => string,
        nextState: (nextState : Object) => string,
        error: (error: any, prevState: Object) => string
    }
}
```