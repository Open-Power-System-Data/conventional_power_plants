$(function () {
    console.log('ready....')
    $('img.centerImg').wrap(function () {
        return "<center>" + $(this).text() + "</center>"
    })
})