# Обход reCAPTCHA на сайте фриланса FL.ru - для парсинга
Обход reCAPTCHA на сайте фриланса FL.ru - для парсинга

## Требования
```javascript
    PhantomJS
    CasperJS
    Логин и пароль на FL.ru
    API ключ с anti-captcha.com
```

## Пример использования:
```javascript
    casperjs get_recaptcha.js --url=https://www.fl.ru/login/ --name=name_file --antigatekey=key --fl_login="login" --fl_password="password" --anticaptcha_time=25000
```
## Возвращает:
```javascript
    {
        "open_page" : 
        {
            "title" : Заголовок страницы,
            "fl_login" : Логин на фрилансе,
            "fl_password" : Пароль на фрилансе,
            "cookie" : путь к файлу cookies,
            "capture" : путь к файлу скриншота страницы,
            "html" : путь к файлу html страницы,
            "status" : код ответа
        },
        "auth_page" : 
        {
            "title": Заголовок авторизованной страницы,
            "cookie": Путь к файлу авторизованных cookies,
            "capture": путь к файлу скриншота авторизованной страницы,
            "html" : путь к файлу html авторизованной страницы,
            "status": код ответа,
            "PHPSESSID": PHP авторизованной сессии
        }    
    }
```

## Создание скриншота + html + json с отчетом
Великоленый аналог curl средствами CasperJS
 
## Пример использования: 
```javascript
    casperjs get_html.js --url=https://www.fl.ru/ --name=temp
```

## Возвращает:
```javascript
        {
            "title" : Заголовок страницы,
            "cookie" : путь к файлу cookies,
            "capture" : путь к файлу скриншота страницы,
            "html" : путь к файлу html страницы,
            "status" : код ответа
        }
```


P. S. Делать злых роботов не хорошо, а хороших можно. 

![Alt-текст](https://www.nastol.com.ua/pic/201212/1366x768/nastol.com.ua-37591.jpg "Делаем добрых роботов")
