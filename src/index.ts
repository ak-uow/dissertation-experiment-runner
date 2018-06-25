/// <reference path="../definitions/vorpal/vorpal.d.ts" />

import Vorpal from 'vorpal';
import VorpalLog from 'vorpal-log';
import { exp_run as server } from "./server-api";
import { exp_run as user } from "./user-api";
import { exp_run as meta } from "./meta-api";

const cliName = 'exp-run';

const vorpal = new Vorpal();

vorpal.use(VorpalLog);

vorpal.history(cliName);
vorpal.version("0.1.0");
vorpal.localStorage(cliName);

const serverAPI = new server.ServerApi(vorpal);
const userAPI = new user.UserApi(vorpal);
const metaAPI = new meta.MetaApi(vorpal);

vorpal
    .delimiter(`${cliName}$`)
    .show()
    .log("Welcome to the test experiment runner! Type 'help' for a list of instructions to type into the console.")
    .parse(process.argv);