import {OpaqueToken, provide, Provider} from "angular2/core";
import {BehaviorSubject} from "rxjs/Rx";
import {
    createMiddleware,
    usePreMiddleware,
    usePostMiddleware
} from '@ngrx/store';

export interface LoggerOptions {
    level? : 'log' | 'console' | 'warn' | 'error' | 'info',
    collapsed? : boolean, //Should log group be collapsed?
    duration? : boolean, //Print duration with action?
    timestamp? : boolean, //Print timestamp with action?
    stateTransformer? : (state : Object) => Object, //Transform state before print
    actionTransformer? : (actn : Object) => Object, //Transform action before print
    colors? : {
        title: (action : Object) => string,
        prevState: (prevState : Object) => string,
        action: (action: Object) => string,
        nextState: (nextState : Object) => string,
        error: (error: any, prevState: Object) => string
    }
}

export interface ColorOptions {
    (Object) : string
}

const logger = console;
const LOGGER = new OpaqueToken('@ngrx/logger');
const LOGGER_OPTIONS = new OpaqueToken('@ngrx/logger/options');
const LOGGER_BUFFER = new OpaqueToken('@ngrx/logger/buffer');
const INIT_ACTION = '@@ngrx/INIT';

const repeat = (str, times) => (new Array(times + 1)).join(str);
const pad = (num, maxLength) => repeat(`0`, maxLength - num.toString().length) + num;
const formatTime = (time) => `@ ${pad(time.getHours(), 2)}:${pad(time.getMinutes(), 2)}:${pad(time.getSeconds(), 2)}.${pad(time.getMilliseconds(), 3)}`;
const timer = typeof performance !== `undefined` && typeof performance.now === `function` ? performance : Date;

const getLogLevel = (level, action, payload, type) => {
    switch (typeof level) {
        case `object`:
            return typeof level[type] === `function` ? level[type](...payload) : level[type];
        case `function`:
            return level(action);
        default:
            return level;
    }
};

const printBuffer = options => logBuffer => {
    const {actionTransformer, collapsed, colors, timestamp, duration, level} = options;
    logBuffer.forEach((logEntry, key) => {
        const { started, startedTime, action, prevState, error } = logEntry;
        let { took, nextState } = logEntry;
        const nextEntry = logBuffer[key + 1];
        if (nextEntry) {
            nextState = nextEntry.prevState;
            took = nextEntry.started - started;
        }

        const formattedAction = actionTransformer(action);
        const isCollapsed = (typeof collapsed === `function`) ? collapsed(() => nextState, action) : collapsed;

        const formattedTime = formatTime(startedTime);
        const titleCSS = colors.title ? `color: ${colors.title(formattedAction)};` : null;
        const title = `action ${timestamp ? formattedTime : ``} ${formattedAction.type} ${duration ? `(in ${took.toFixed(2)} ms)` : ``}`;

        try {
            if (isCollapsed) {
                if (colors.title) logger.groupCollapsed(`%c ${title}`, titleCSS);
                else logger.groupCollapsed(title);
            } else {
                if (colors.title) logger.group(`%c ${title}`, titleCSS);
                else logger.group(title);
            }
        } catch (e) {
            logger.log(title);
        }

        const prevStateLevel = getLogLevel(level, formattedAction, [prevState], `prevState`);
        const actionLevel = getLogLevel(level, formattedAction, [formattedAction], `action`);
        const errorLevel = getLogLevel(level, formattedAction, [error, prevState], `error`);
        const nextStateLevel = getLogLevel(level, formattedAction, [nextState], `nextState`);

        if (prevStateLevel) {
            if (colors.prevState) logger[prevStateLevel](`%c prev state`, `color: ${colors.prevState(prevState)}; font-weight: bold`, prevState);
            else logger[prevStateLevel](`prev state`, prevState);
        }

        if (actionLevel) {
            if (colors.action) logger[actionLevel](`%c action`, `color: ${colors.action(formattedAction)}; font-weight: bold`, formattedAction);
            else logger[actionLevel](`action`, formattedAction);
        }

        if (error && errorLevel) {
            if (colors.error) logger[errorLevel](`%c error`, `color: ${colors.error(error, prevState)}; font-weight: bold`, error);
            else logger[errorLevel](`error`, error);
        }

        if (nextStateLevel) {
            if (colors.nextState) logger[nextStateLevel](`%c next state`, `color: ${colors.nextState(nextState)}; font-weight: bold`, nextState);
            else logger[nextStateLevel](`next state`, nextState);
        }

        try {
            logger.groupEnd();
        } catch (e) {
            logger.log(`—— log end ——`);
        }
    });
    logBuffer.length = 0;
};

const preLogger = createMiddleware((log, options) => {
    return action$ => action$
        .do(action => {
            const {stateTransformer} = options;
            let logEntry = {
                started: timer.now(),
                startedTime: new Date(),
                prevState: stateTransformer(log.getValue()),
                action
            };
            log.next(logEntry);
        });
}, [ LOGGER, LOGGER_OPTIONS ]);

const postLogger = createMiddleware((log, loggerBuffer, options) => {
    const {stateTransformer} = options;
    return state$ => state$
        .do(state => {
            if(state.type !== INIT_ACTION) {
                let logInfo = log.getValue();
                logInfo.took = timer.now() - logInfo.started;
                logInfo.nextState = stateTransformer(state);
                loggerBuffer([logInfo]);
            }
        });
}, [ LOGGER, LOGGER_BUFFER, LOGGER_OPTIONS ]);

export const loggerMiddleware = (opts : LoggerOptions = {}) => {
    const defaults = {
        level : `log`,
        collapsed : false,
        duration : false,
        timestamp : true,
        stateTransformer : state => state,
        actionTransformer : actn => actn,
        colors : {
            title: () => `#000000`,
            prevState: () => `#9E9E9E`,
            action: () => `#03A9F4`,
            nextState: () => `#4CAF50`,
            error: () => `#F20404`,
        }
    };
    const options : LoggerOptions = Object.assign({}, defaults, opts);

    return [
        provide(LOGGER, {
            useFactory(){
                return new BehaviorSubject(null);
            }
        }),
        provide(LOGGER_OPTIONS, {
            useValue: options
        }),
        provide(LOGGER_BUFFER, {
            useValue: printBuffer(options)
        }),
        usePreMiddleware(preLogger),
        usePostMiddleware(postLogger)
    ]
};