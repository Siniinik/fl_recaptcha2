/**
 * Команда для запроса:
 *  casperjs get_recaptcha.js
 *
 * --ссылка:
 * @url=https://www.fl.ru/login/
 *
 * --имя_файла для сохранения данных:
 * @name=temp
 *
 * --API ключ с anti-captcha.com
 * @antigatekey=key
 *
 * --Логин от FL
 * @fl_login=login
 *
 * --Пароль от FL
 * @fl_password=password
 *
  * --Время на решение капчи
 * @anticaptcha_time=25000
 *
 * Пример:
 * casperjs get_recaptcha.js --url=https://www.fl.ru/login/ --name=temp --antigatekey=key --fl_login="login" --fl_password="password" --anticaptcha_time=25000
 *
 * @type {Object}
 */
var casper = require('casper').create({
    viewportSize: {
        width: 1024,
        height: 768
    },
    pageSettings: {
        webSecurityEnabled: false,
        // Таймаут загрузки ресурсов
        resourceTimeout: 60000
    },
    verbose: true,
    loglevel: 'debug',
    // Таймаут ожидания доступности селекторов
    waitTimeout: 60000,
    exitOnError: true
}),
    utils = require('utils'),
    fs = require('fs');

var url, name, antigatekey, fl_login, fl_password, anticaptcha_time=5000;
var dom;

/**
 * Прием переменных с консоли
 */
//ссылка
if (casper.cli.has("url"))
    url=casper.cli.get("url");

//имя запроса
if (casper.cli.has("name"))
    name=casper.cli.get("name");

//ключ антикапчи
if (casper.cli.has("antigatekey"))
    antigatekey=casper.cli.get("antigatekey");

//логин fl.ru
if (casper.cli.has("fl_login"))
    fl_login=casper.cli.get("fl_login");

//пароль fl.ru
if (casper.cli.has("fl_password"))
    fl_password=casper.cli.get("fl_password");

//Время на разбор антикапчи
if (casper.cli.has("anticaptcha_time"))
    anticaptcha_time=casper.cli.get("anticaptcha_time");

/**
 * Зачищаем предыдущие отчеты
 */
fs.removeTree(fs.pathJoin(fs.workingDirectory, 'temp'));

/**
 * Переменные путей
 */
//файл json отчета
var path_json = fs.pathJoin(fs.workingDirectory, 'temp', name+'.json');

//файл скриншота
var path_capture = fs.pathJoin(fs.workingDirectory, 'temp', name+'.jpg');
//файл скриншота2
var path_capture2 = fs.pathJoin(fs.workingDirectory, 'temp', name+'2.jpg');

//файл html
var path_html = fs.pathJoin(fs.workingDirectory, 'temp', name+'.html');
//файл html2
var path_html2 = fs.pathJoin(fs.workingDirectory, 'temp', name+'2.html');

//файл с кукой
var path_cookies = fs.pathJoin(fs.workingDirectory, 'temp', name+'.txt');
//файл с кукой2
var path_cookies2 = fs.pathJoin(fs.workingDirectory, 'temp', name+'2.txt');


/**
 * Запускаем страничку
 */
casper.start();
casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)');
casper.thenOpen(url, function(response) {
    /**
     * Сохраняем DOM
     */
    dom=this;
    /**
     * Сохраняем html в файл
     */
    var html = this.page.content;
    fs.write(path_html, html, 'w');

    /**
     * сохраняем куку страницы
     */
    cookies_save(this, path_cookies);
    var cookies=cookies_string();
    /**
     * Делаем скриншот
     */
    this.capture(path_capture);

    /**
     * Создаем объект с отчетом
     * @type {{title, capture: *, status: (number|string|*)}}
     */
    var json={
        "open_page":{
            "title": this.getTitle(),
            "fl_login": fl_login,
            "fl_password": fl_password,
            "cookie": path_cookies,
            "capture": path_capture,
            "html" : path_html,
            "status": response.status
        }
    };




    /******************************************/
    /**
     * Пользовательские действия
     */
    /*получаем токен**/
    var u_token_key=dom.evaluate(function () {
        return document.querySelector('input[name=u_token_key]').getAttribute('value');
    });
    /*разгадываем рекапчу***/
    casper.recaptcha(function (recaptcha) {
        casper.fl_auth({
            "recaptcha":recaptcha.solution.gRecaptchaResponse,
            "cookies": cookies,
            "u_token_key":u_token_key,
            "report":json
        }, function (report) {
            /**
             * записываем отчет в файл
             */
            fs.write(path_json, JSON.stringify(report), 'w');
            /**
             * консолим объект
             */
            utils.dump(report);
        });
    });
    /******************************************/
});

/**
 * Обработка рекапчи
 */
casper.recaptcha = function(callback) {
    var sitekey=dom.evaluate(function () {
        return document.querySelector('#el-recaptcha').getAttribute('data-sitekey');
    });

    /**
     * Отправляем капчу на разгадку
     */
    casper.thenOpen('http://api.anti-captcha.com/createTask', {
        method: 'POST',
        data:
            {
                "clientKey": antigatekey,
                "task":
                    {
                        "type": "NoCaptchaTaskProxyless",
                        "websiteURL": url,
                        "websiteKey": sitekey
                    }
            },
        headers: {
            'Content-Type': 'application/json'
        },
    });

    /**
     * Получаем id_задачи - пингуем антикапчу
     */
    casper.then(function(){
        var anticaptcha=JSON.parse(this.getPageContent());
        // utils.dump(anticaptcha);
        if (anticaptcha.errorId==0){
            casper.anticaptcha_getTaskResult(anticaptcha.taskId, function (anticaptcha) {
                callback(anticaptcha);
            });
        }

    });

    return this;
}

casper.anticaptcha_getTaskResult = function(id, callback) {
    casper.thenOpen('https://api.anti-captcha.com/getTaskResult', {
        method: 'POST',
        data:
            {
                "clientKey":antigatekey,
                "taskId": id
            },
        headers: {
            'Content-Type': 'application/json'
        },
    });

    casper.then(function(){
        var anticaptcha=JSON.parse(this.getPageContent());
        if (anticaptcha.status=="processing"){
            casper.wait(anticaptcha_time, function () {
                casper.anticaptcha_getTaskResult(id, callback);
            });
        } else {
            /**
             * Решенная рекапча Google)))
             * @anticaptcha
             */
            callback(anticaptcha);
        }
    });
    return this;
}

/**
 * Логинимся на FL.ru под капчей
 */
casper.fl_auth = function (data, callback) {
    /*
     * Шапка фриланса
     *
     * login: fl_login
     * passwd: fl_pass
     * g-recaptcha-response:
        03AO6mBfzps6VIz-phzU5dYqqNoySzBQ-Lc8LCyY6SG0O2akR3GWCibS5Js9gGHqwSYjlQwyeH-xgqKCuGXc9O_AlWHMNPvk03HyqgJt7FcGue7OyQ5TYBgOoWCj4KMDDaIOyfZSpYZqCfyylxlI5upojfSUb_MaV9QcjfQ_i3Xrrib26MsTjBUrwRThevutYLZH3VRwQiHxeALUECdknyJRpuJgHJVpClGNCphMCd2-vZS7ZlGEXRFsjJBG_BQ7z_4Zg5jNetqjYiun8CsSrdg5oNx_ZFH9U_JFMl4vibLypCjPcWud2D_fscacsQRGrH8XOs8lg52m2OP-saBOVnnYH84u0kREvgNw-c7vYtFL3E-BzwhinV9EgBs1GwMeHBKjhROTCHzNgt
     * autologin:1
     * singin:
     * u_token_key:e54f9de37035e2c0a009a7e7079f5bfb
     */
    var param = {
        method: 'POST',
        data:
            {
                "login": fl_login,
                "passwd": fl_password,
                "g-recaptcha-response": data.recaptcha,
                "autologin": 1,
                "singin": "",
                "u_token_key": data.u_token_key
            },
        headers: {
            "Cookie": data.cookies
        }
    };
    casper.thenOpen(url, param);

    casper.then(function(response){
        /**
         * Сохраняем куки в файл
         */
        cookies_save(this, path_cookies2);
        /**
         * Сохраняем html в файл
         */
        var html = this.page.content;
        fs.write(path_html2, html, 'w');
        /**
         * Делаем скриншот
         */
        this.capture(path_capture2);

        data.report.auth_page={
            "title": this.getTitle(),
            "cookie": path_cookies2,
            "capture": path_capture2,
            "html" : path_html2,
            "status": response.status,
            "PHPSESSID": cookies_get(this, "PHPSESSID")
        };
        callback(data.report);
    });

}

/**
 * Сохранение куки для заданной страницы в файл
*/
function cookies_save(dom, file) {
    "use strict";
    var res = '';
    dom.page.cookies.forEach(function (cookie) {
        res += utils.format("%s\t%s\t%s\t%s\t%s\t%s\t%s\r\n", cookie.domain, 'TRUE', cookie.path, 'FALSE', cookie.expiry, cookie.name, cookie.value);
    });
    fs.write(file, res, 'w');
};

/**
 * Запрос значения куки
*/
function cookies_get(dom, name) {
    "use strict";
    var res = '';
    dom.page.cookies.forEach(function (cookie) {
        if (cookie.name==name){
            res = cookie.value;
        }
    });
    return res;
};

/**
 * Сохранение куки для заданной страницы в файл
 */
function cookies_string() {
    "use strict";
    var res = '';
    dom.page.cookies.forEach(function (cookie) {
        res += utils.format("%s=%s; ", cookie.name, cookie.value);
    });
    return res;

};

casper.run();