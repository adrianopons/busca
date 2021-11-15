async function aguardarPorClass(page, classDoSeletor) {
    await page.waitForFunction((classDoSeletor) => {
        if (document.querySelector(classDoSeletor) !== undefined)
            return true
    }, {polling: 200}, classDoSeletor);
}

module.exports = {
    aguardarPorClass
}