'use strict';

import http from 'http';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

import cors from 'cors';
import multer from 'multer';

import cookieParser from 'cookie-parser';
import expressSession from 'express-session';

import passport from 'passport';
import flash from 'connect-flash';

import config from './config/config';
import controllerLoader from './loader/controller_loader';
import local_login from './passport/local_login';

// logger
import logger from './util/logger';


// Declaration of createApp function
const createApp = () => {
    const app = express();

    app.use(cors());
    app.use('/', express.static(path.join(__dirname, 'public')));
    
    app.use(bodyParser.urlencoded({extended:false}));
    app.use(bodyParser.json());
    
    
    const upload = initUpload();


    app.use(cookieParser());
    
    app.use(expressSession({
        secret: 'my key',
        resave: true,
        saveUninitialized: true
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    
    passport.use('local-login', local_login);
        

    const router = express.Router();
    app.use('/', router);


    // load registered controllers
    controllerLoader.load(router, upload);


    initSwagger(app);
    

    return app;    
};

// Declaration of initUpload function
const initUpload = () => {
 
    const storage = multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, 'uploads');
        },
        filename: function(req, file, callback) {
            const extension = path.extname(file.originalname);
            const basename = path.basename(file.originalname, extension);
    
            callback(null, basename + Date.now() + extension);
        }
    });
    
    const upload = multer({
        storage: storage,
        limits: {
            files: 10,
            fileSize: 1024 * 1024 * 1024
        }
    });
     
    return upload;
};

const initSwagger = (app) => {
    const expressSwagger = require('express-swagger-generator')(app);

    let options = {
        swaggerDefinition: {
            info: {
                description: 'This is a boilerplate server',
                title: 'UbiAccess',
                version: '1.0.0',
            },
            host: 'localhost:7001',
            basePath: '/',
            produces: [
                "application/json",
                "application/xml"
            ],
            schemes: ['http', 'https'],
            securityDefinitions: {
                JWT: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                    description: "",
                }
            }
        },
        basedir: __dirname, //app absolute path
        files: ['./controllers/**/*.js'] //Path to the API handle folder
    };

    expressSwagger(options);

}


let namespace;

// Declaration of main function
const main = () => {

    const app = createApp();
    const server = http.createServer(app).listen(config.server.port, () => {
        logger.debug('Server started -> ' + config.server.port);
    
        const serverHost = server.address().address;
        const serverPort = server.address().port;
        namespace = serverHost + '_' + serverPort + '_' + process.pid;
        logger.debug('Namespace -> ' + namespace);
    
    });
        
    return server;
};

// Call main function
const server = main();

