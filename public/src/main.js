import {createQuiz} from './application/quiz.js';
import {localStore} from './infrastructure/local-storage.js';
import {mount} from './interfaces/app.js';

mount(createQuiz(localStore));
