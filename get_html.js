/**
 *
 * --ссылка:
 * @url=https://www.fl.ru/login/
 *
 * --имя_файла для сохранения данных:
 * @name=temp
 *
 * Пример использования: casperjs get_html.js --url=https://www.fl.ru/ --name=temp
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

var url = '';
var name = '';

if (casper.cli.has("url"))
    url=casper.cli.get("url");

if (casper.cli.has("name"))
    name=casper.cli.get("name");

/**
 * Зачищаем предыдущие отчеты
 */
fs.removeTree(fs.pathJoin(fs.workingDirectory, 'temp'));

/**
 * Переменные путей
 */
var json_path = fs.pathJoin(fs.workingDirectory, 'temp', name+'.json');
var capture_path = fs.pathJoin(fs.workingDirectory, 'temp', name+'.jpg');
var html_path = fs.pathJoin(fs.workingDirectory, 'temp', name+'.html');
var cookies = fs.pathJoin(fs.workingDirectory, 'cookies');


/**
 * Запускаем страничку
 */
casper.start();
casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)');
casper.thenOpen(url, function(response) {
    /**
     * Сохраняем html в файл
     */
    var html = this.page.content;
    fs.write(html_path, html, 'w');

    /**
     * Делаем скриншот
     */
    this.capture(capture_path);

    /**
     * Создаем объект с отчетом
     * @type {{title, capture: *, status: (number|string|*)}}
     */
    var json={
        "title": this.getTitle(),
        "capture": capture_path,
        "html" : html_path,
        "status": response.status
    };

    /**
     * консолим объект
     */
    utils.dump(json);

    /**
     * записываем отчет в файл
     */
    fs.write(json_path, JSON.stringify(json), 'w');
});


casper.run();