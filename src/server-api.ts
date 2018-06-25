import EventEmitter from 'events';
import Vorpal from "vorpal";
import {isURL} from "validator";
import range from "lodash/range";
import fetch, { Response as NFResponse } from "node-fetch";
import {API} from "../definitions/exp-run";

export module exp_run {

    export class ServerApi implements API {

        constructor(private vorpalInstance: Vorpal) {
            this.setupServerGetter();
            this.setupServerSetter();
            this.setupServerRedirectGetter();
            this.setupServerRedirectSetter();
        }

        public get url(): string { return this.serverUrl; }

        private setupServerGetter() {
            const serverGetter = () => {
                return this.serverUrl;
            };

            this.vorpalInstance
                .command(ServerApi.COMMAND_NAME_GET_SERVER, ServerApi.COMMAND_DESC_GET_SERVER)
                .action(function(args, callback) {
                    const url: string = serverGetter();
                    const message: string = url.length ? `${ServerApi.ACTION_DESC_GET_SERVER}${url}` : ServerApi.ACTION_DESC_GET_SERVER_NOT_SET;

                    this.log(message);

                    callback();
                });
        }

        private setupServerSetter() {
            const serverSetter = (url: string) => {
                this.serverUrl = url;
            };

            this.vorpalInstance
                .command(ServerApi.COMMAND_NAME_SET_SERVER, ServerApi.COMMAND_DESC_SET_SERVER)
                .validate(function (args) {
                    const url: string | null = <string>args.url || null;

                    let result: string | true;

                    if (url === null || isURL(<string>url, { require_tld: false })) {
                        result = true;
                    } else {
                        result = ServerApi.VALID_FAIL_DESC_SET_SERVER_URL;
                    }

                    return result;
                })
                .action(function(args, callback) {
                    const url: string = <string>args.url;
                    const message: string = url ? `${ServerApi.ACTION_DESC_SET_SERVER}${url}` : ServerApi.ACTION_DESC_SET_SERVER_EMPTY;

                    this.log(message);
                    serverSetter(url || '');

                    callback();
                });
        }

        private setupServerRedirectGetter() {
            const serverRedirectGetter = () => {
                return this.serverRedirect;
            };

            this.vorpalInstance
                .command(ServerApi.COMMAND_NAME_GET_SERVER_REDIRECT, ServerApi.COMMAND_DESC_GET_SERVER_REDIRECT)
                .action(function(args, callback) {
                    const num: number = <number>serverRedirectGetter();
                    const message: string = num !== null ? `${ServerApi.ACTION_DESC_GET_SERVER_REDIRECT}${num}` : ServerApi.ACTION_DESC_GET_SERVER_REDIRECT_NOT_SET;

                    this.log(message);

                    callback();
                });
        }

        private setupServerRedirectSetter() {
            const serverSetter = (url: number | null, cb: () => void) => {
                this.serverRedirect = url;
                this.updateServerRedirect(cb);
            };
            const serverIsSet = () => {
                return !!this.serverUrl.length;
            };

            this.vorpalInstance
                .command(ServerApi.COMMAND_NAME_SET_SERVER_REDIRECT, ServerApi.COMMAND_DESC_SET_SERVER_REDIRECT)
                .validate(function (args) {
                    const num: number | null = <number>args.number || null;

                    let result: string | true;

                    if (!serverIsSet()) {
                        result = ServerApi.VALID_FAIL_DESC_SET_SERVER_REDIRECT_URL;
                    } else if (!ServerApi.isRedirectWithinRange(<number>num) && num !== null) {
                        result = ServerApi.VALID_FAIL_DESC_SET_SERVER_REDIRECT_NUM;
                    } else {
                        result = true;
                    }

                    return result;
                })
                .action(function(args, callback) {
                    const num: number = <number>args.number;
                    const message: string = num ? `${ServerApi.ACTION_DESC_SET_SERVER_REDIRECT}${num}` : ServerApi.ACTION_DESC_SET_SERVER_REDIRECT_EMPTY;

                    this.log(message);
                    serverSetter(num || null, callback);
                });
        }

        private updateServerRedirect(cb: () => void): void {
            const endpoint: string = `${this.serverUrl}${ServerApi.PATH_FRAGMENT_SET_SERVER_REDIRECT}`;
            const resHandler = (res: NFResponse) => {
                return res.text();
            };
            const textHandler = (text: string) => {
                this.vorpalInstance.log(text);
                cb();
            };

            const fetchPromise: Promise<NFResponse> = this.serverRedirect ? fetch(`${endpoint}${this.serverRedirect}`) : fetch(endpoint, { method: "DELETE" });

            fetchPromise.then(resHandler).then(textHandler);
        }

        private static isRedirectWithinRange(num: number): boolean {
            return range(1, 9).indexOf(num) != -1;

        }

        private static readonly COMMAND_NAME_GET_SERVER: string = "get-server";
        private static readonly COMMAND_DESC_GET_SERVER: string = "Gets the current server URL";
        private static readonly ACTION_DESC_GET_SERVER: string = "Server URL set to: ";
        private static readonly ACTION_DESC_GET_SERVER_NOT_SET: string = "Server URL not set!";

        private static readonly COMMAND_NAME_SET_SERVER: string = "set-server [url]";
        private static readonly COMMAND_DESC_SET_SERVER: string = "Sets the server URL. Passing no value unsets the server URL.";
        private static readonly VALID_FAIL_DESC_SET_SERVER_URL: string = "Cannot set server URL to invalid URL";
        private static readonly ACTION_DESC_SET_SERVER: string = "Setting server URL to: ";
        private static readonly ACTION_DESC_SET_SERVER_EMPTY: string = "Unsetting server URL";

        private static readonly COMMAND_NAME_GET_SERVER_REDIRECT: string = "get-server-redirect";
        private static readonly COMMAND_DESC_GET_SERVER_REDIRECT: string = "Gets the server redirect endpoint";
        private static readonly ACTION_DESC_GET_SERVER_REDIRECT: string = "Server redirect endpoint set to: ";
        private static readonly ACTION_DESC_GET_SERVER_REDIRECT_NOT_SET: string = "Server redirect endpoint not set!";

        private static readonly PATH_FRAGMENT_SET_SERVER_REDIRECT: string = "/setredirect/";
        private static readonly COMMAND_NAME_SET_SERVER_REDIRECT: string = "set-server-redirect [number]";
        private static readonly COMMAND_DESC_SET_SERVER_REDIRECT: string = "Sets the server redirect endpoint";
        private static readonly VALID_FAIL_DESC_SET_SERVER_REDIRECT_URL: string = "Cannot set server redirect when server URL not set";
        private static readonly VALID_FAIL_DESC_SET_SERVER_REDIRECT_NUM: string = "Cannot set server redirect to a number out of range (1-8)";
        private static readonly ACTION_DESC_SET_SERVER_REDIRECT: string = "Setting server redirect endpoint to: ";
        private static readonly ACTION_DESC_SET_SERVER_REDIRECT_EMPTY: string = "Unsetting server redirect endpoint";

        private serverUrl: string = "";
        private serverRedirect: number | null = null;
    }
}