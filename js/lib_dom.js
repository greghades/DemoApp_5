class Cl_object {
    constructor({
                    app = null,
                    owner = null,
                } =
                    {
                        app: null,
                        owner: null
                    }) {
        this.app = app ? app : owner?.app
        this.owner = owner
        this.appError = null
    }

    onload() {
        for (let obj in this)
            if (obj !== 'app' && obj !== 'owner' && this[obj] && this[obj].onload)
                this[obj].onload()
    }

    refresh() {
        for (let obj in this)
            if (obj !== 'app' && obj !== 'owner' && this[obj] && this[obj].refresh)
                this[obj].refresh()
    }
}

class Cl_cookies extends Cl_object {
    constructor({app}) {
        super({app: app})
        this.adjustCookies()
    }

    adjustCookies() {
        let decodedCookie = decodeURIComponent(document.cookie),
            ca = decodedCookie.split(';')
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i]
            while (c.charAt(0) === ' ')
                c = c.substring(1)
            let p = c.indexOf('=')
            if (p > -1) {
                let name = c.substring(0, p),
                    value = c.substring(p + 1)
                this.set(name, value)
            }
        }
    }

    /**
     * @param cname
     * @param cValue
     * @param exDays
     * source: https://www.w3schools.com/js/js_cookies.asp
     */
    set(cname, cValue = '', exDays = 7) {
        let d = new Date()
        d.setTime(d.getTime() + (exDays * 24 * 60 * 60 * 1000))
        let expires = `expires=${d.toUTCString()}`
        document.cookie = `${cname}=${cValue};${expires};path=/`
    }

    /**
     * @param cname
     * @returns {string}
     * source: https://www.w3schools.com/js/js_cookies.asp
     */
    get(cname) {
        let name = `${cname}=`,
            decodedCookie = decodeURIComponent(document.cookie),
            ca = decodedCookie.split(';')
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim()
            if (c.indexOf(name) === 0)
                return c.substring(name.length, c.length)
        }
        return ""
    }

    isSet(cname) {
        let name = `${cname}=`,
            decodedCookie = decodeURIComponent(document.cookie),
            ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim()
            if (c.indexOf(name) === 0)
                return true
        }
        return false
    }
}

class Cl_urlParams extends Cl_object {
    constructor({
                    app,
                }) {
        super({app: app})
        this.items = new URLSearchParams(location.search)
    }

    get(key) {
        return this.items.get(key)
    }

    has(key) {
        return this.items.has(key)
    }
}

class Cl_app extends Cl_object {
    constructor({phpUrl = null} = {phpUrl: null}) {
        super()
        this.phpUrl = phpUrl ? phpUrl : false
        this.appVersion = 'v1.0.220621-1240'
        this.urlParams = new Cl_urlParams({app: this})
        this.easyUtil = new Cl_easyUtil({app: this})
        this.infoModal = new Cl_infoModal({app: this})
    }

    get urlShare() {
        return `https://easyrestoranapp.com/_/${this.menu.restaurant.login.toLowerCase()}`
    }

    whatsAppContact() {
        let text = encodeURIComponent(`Por favor bríndame información de la aplicación Easy Restoran APP\nhttps://easyrestoranapp.com`),
            phone = '&phone=584126797270'
        window.open(`https://api.whatsapp.com/send?text=${text}${phone}`, '_blank')
    }
}

class Cl_easyUtil extends Cl_object {
    constructor({app}) {
        super({app: app})
    }

    get txtTip() {
        let result = {}
        result.txtSendContactOk = 1
        result.txtSendContactFail = 2
        return result
    }

    get pageLang() {
        return document.getElementsByTagName('html')[0].lang || 'en'
    }

    tipMsg(tipId, lang = this.pageLang) {
        let result
        if (!this.tewlanguages.includes(lang)) lang = 'en'
        if (tipId === this.txtTip.txtSendContactOk)
            result = {
                'en': 'Message was sent successfully to: *email*',
                'es': 'Mensaje enviado exitosamente a: *email*',
            }
        else if (tipId === this.txtTip.txtSendContactFail)
            result = {
                'en': 'Error sending message: *error*',
                'es': 'Error enviando el mensaje: *error*',
            }
        else result = {
                'en': 'NO MESSAGE DEFINED',
                'es': 'NO HAY MENSAJE DEFINIDO',
            }
        return result[lang]
    }

    modelDo(currentThis,
            {
                formDataSrc = null,
                phpURL = null,
                op = null,
                ajaxResult = null,
                params = null,
                getPercent = null,
                alertOnError = true,
            }
    ) {
        phpURL = phpURL ? phpURL : this.app.phpUrl
        let formData = formDataSrc ? new FormData(formDataSrc) : new FormData()
        formData.append('op', op)
        for (let key in params)
            if (params.hasOwnProperty(key) && params[key] !== null)
                formData.append(key, params[key]);
        $.ajax({
                url: phpURL,
                type: "POST",
                // dataType: "html",
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                xhr: function () {
                    let xhr = new window.XMLHttpRequest()
                    xhr.upload.addEventListener("progress", function (evt) {
                        if (evt.lengthComputable) {
                            let percentComplete = evt.loaded / evt.total
                            percentComplete = (percentComplete * 100).toFixed(0)
                            if (getPercent)
                                getPercent(percentComplete)
                        }
                    }, false)
                    return xhr
                }
            }
        ).done(function (ajaxResponse) {
                // alert(`modelDo.done: ${ajaxResponse}`)
                let response = null
                try {
                    response = JSON.parse(ajaxResponse)
                    if (!response)
                        response = {error: 'modelDo - JSON null received'}
                } catch (e) {
                    response = {error: 'modelDo - Invalid JSON string received'}
                }
                if (response.appError) {
                    if (alertOnError)
                        alert(`Check console: ${response.appError}`)
                    console.error(response.appError)
                }
                ajaxResult.call(currentThis, response)
            }
        ).fail(function (jqXHR, textStatus, errorThrown) {
            alert(`modelDo.fail\njqXHR: ${JSON.stringify(jqXHR)}\ntextStatus:  ${textStatus}\nerrorThrown:  ${errorThrown}`)
            let error = null
            if (jqXHR.status === 0)
                error = 'Not connect: Verify Network.'
            else if (jqXHR.status === 404)
                error = 'Requested page not found [404]'
            else if (jqXHR.status === 500)
                error = 'Internal Server Error [500].'
            else if (textStatus === 'parsererror')
                error = 'Requested JSON parse failed.'
            else if (textStatus === 'timeout')
                error = 'Time out error.'
            else if (textStatus === 'abort')
                error = 'Ajax request aborted.'
            else
                error = 'Uncaught Error: ' + jqXHR.responseText
            ajaxResult.call(currentThis, {error: error})
        })
    }

    textToClipboard({text, showAlert = true}) {
        navigator.clipboard.writeText(text)
        if (showAlert)
            alert(`Copiado al portapapeles: ${text}`)
    }
}

class Cl_domSection extends Cl_object {
    Cl_htmlElement = class extends Cl_object {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            value = null,
            setClasses = null,
            innerHTML = null,
            init = null,
            refresh = null,
            show = null,
            disabled = null,
            optional = null
        }) {
            super({app, owner: owner})
            if (!elementId && !className) {
                alert(`LIB-DOM: No se especificó ni elementId ni className (sectionId=${sectionId})`)
                throw new Error(`LIB-DOM: No se especificó ni elementId ni className (sectionId=${sectionId})`)
            } else {
                if (elementId) {
                    this.domElem = document.getElementById(`${sectionId}_${elementId}`)
                    if (!optional && !this.domElem) {
                        alert(`No existe el elemento: ${sectionId}_${elementId}`)
                        throw new Error(`No existe el elemento: ${sectionId}_${elementId}`)
                    }
                } else {
                    this.domElem = domElem?.getElementsByClassName(`${sectionId}_${className}`)[0]
                    if (!optional && !this.domElem) {
                        alert(`No existe el elemento con ClassName: ${sectionId}_${className}`)
                        throw new Error(`No existe el elemento con ClassName: ${sectionId}_${className}`)
                    }
                }
                if (this.domElem) {
                    // this.domElem.setAttribute('tabindex', '-1') // Solución para que al elemento se le pueda hacer focus()
                    this.domElem.app = this.app
                    this.domElem.owner = this.owner
                    if (innerHTML !== null) this.domElem.innerHTML = innerHTML
                    let oi = this
                    if (value) this.domElem.value = value
                    if (setClasses && setClasses.remove)
                        for (let newClass of setClasses.remove)
                            this.domElem.classList.remove(newClass)
                    if (setClasses && setClasses.add)
                        for (let newClass of setClasses.add)
                            this.domElem.classList.add(newClass)
                    this.domElem.show = function (show = true) {
                        oi.domElem.classList.remove('d-none')
                        if (!Boolean(show)) oi.domElem.classList.add('d-none')
                    }
                    this.domElem.visible = function () {
                        return !oi.domElem.classList.contains('d-none')
                    }
                    if (show === false) this.domElem.show(false)
                    if (Boolean(disabled)) this.domElem.disabled = true
                    if (refresh) this.domElem.refresh = refresh
                    if (init) init()
                }
            }
        }

        getElement() {
            return this.domElem
        }
    }

    Cl_htmlInputTextElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            value = null,
            maxLength = null,
            regExpAllowedChars = null,
            required = null,
            setUpperCase = null,
            trim = null,
            isPassword = null,
            isTextArea = null,
            isEmail = null,
            onchange = null,
            refresh = null,
            readonly = null,
            disabled = null,
            oninput = null,
            show = null,
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                value: value,
                refresh: refresh,
                show: show,
                disabled: disabled
            })
            if (!isTextArea) { // todo: identificar auto que el elemento es TextArea
                this.domElem.type = 'text'
                if (isPassword)
                    this.domElem.type = 'password'
                else if (isEmail)
                    this.domElem.type = 'email'
            }
            if (maxLength) this.domElem.maxLength = maxLength
            if (setUpperCase) this.domElem.setUpperCase = Boolean(setUpperCase)
            if (trim) this.domElem.trim = Boolean(trim)
            if (regExpAllowedChars) this.domElem.regExpAllowedChars = regExpAllowedChars
            this.domElem.onchange = onchange
            this.domElem.oninput = oninput
            let oi = this.domElem
            this.domElem.required = Boolean(required)
            this.domElem.setReadonly = function (value) {
                if (Boolean(value))
                    oi.setAttribute('readonly', 'readonly')
                else oi.removeAttribute('readonly')
            }
            this.domElem.setReadonly(readonly)
            this.domElem.addEventListener("input", e => {
                if (oi.regExpAllowedChars) {
                    let valueToCheck = oi.value,
                        caretPosition = oi.selectionStart,
                        hasError = false
                    oi.value = ''
                    for (let char of valueToCheck)
                        if (RegExp(`[${oi.regExpAllowedChars}]`).test(char))
                            oi.value += char
                        else hasError = true
                    if (!hasError)
                        oi.setSelectionRange(caretPosition, caretPosition)
                    else oi.setSelectionRange(caretPosition - 1, caretPosition - 1)
                }
                if (oi.setUpperCase)
                    oi.value = oi.value.toUpperCase()
            })
        }
    }

    Cl_htmlInputCurrencyElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            value = null,
            minValue = null,
            maxValue = null,
            required = null,
            onchange = null,
            refresh = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                value: value,
                refresh: refresh
            })
            this.domElem.type = 'number'
            this.domElem.step = '0.01'
            this.domElem.min = '0'
            if (minValue)
                this.domElem.min = minValue
            if (maxValue)
                this.domElem.max = maxValue
            if (required) this.domElem.setAttribute('required', 'required')
            this.domElem.onchange = onchange
        }
    }

    Cl_htmlInputHiddenElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            refresh = null,
            onchange = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                refresh: refresh
            })
            this.domElem.onchange = onchange
        }
    }

    Cl_htmlInputRadioElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            checked = null,
            required = null,
            onchange = null,
            refresh = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                refresh: refresh
            })
            if (required) this.domElem.setAttribute('required', 'required')
            this.domElem.checked = Boolean(checked)
            this.domElem.onchange = onchange
        }
    }

    Cl_htmlInputCheckElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            checked = null,
            required = null,
            onchange = null,
            refresh = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                refresh: refresh
            })
            if (required) this.domElem.setAttribute('required', 'required')
            this.domElem.onchange = onchange
            if (checked !== null)
                this.domElem.checked = Boolean(checked)
        }
    }

    Cl_htmlInputSelectElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            value = null,
            required = null,
            onchange = null,
            refresh = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                value: value,
                refresh: refresh
            })
            if (required) this.domElem.setAttribute('required', 'required')
            this.domElem.onchange = onchange
            let oi = this
            this.domElem.setItemsFromArray = function (array, optionActiveId) {
                if (!Boolean(array)) array = []
                oi.domElem.innerHTML = ''
                for (let optionInfo of array) {
                    let option = document.createElement("option")
                    if (optionInfo[0] === optionActiveId)
                        option.setAttribute('selected', '')
                    option.value = optionInfo[0]
                    option.textContent = optionInfo[1]
                    oi.domElem.appendChild(option)
                }
                if (oi.domElem.options.selectedIndex === -1)
                    oi.domElem.options.selectedIndex = 0
            }
            this.domElem.selectedText = function () {
                return oi.domElem.options[oi.domElem.options.selectedIndex].text
            }
        }
    }

    Cl_htmlTextElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            innerHTML = null,
            refresh = null,
            show = null,
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                refresh: refresh,
                show: show,
                innerHTML: innerHTML
            })
            // this.domElem.innerHTML = innerHTML
        }
    }

    Cl_htmlImgElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            src = null,
            refresh = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                refresh: refresh
            })
            if (Boolean(src)) this.domElem.src = src
        }
    }

    Cl_htmlButtonElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            setClasses = null,
            init = null,
            innerHTML = null,
            refresh = null,
            onclick = null,
            show = null,
            disabled = null,
            optional = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className,
                setClasses: setClasses,
                init: init,
                innerHTML: innerHTML,
                refresh: refresh,
                show: show,
                disabled: disabled,
                optional: optional
            })
            if (this.domElem) this.domElem.onclick = onclick
        }
    }

    Cl_htmlFormElement = class extends this.Cl_htmlElement {
        constructor(app, owner, sectionId, domElem, {
            elementId = null,
            className = null,
            onsubmit = null
        }) {
            super(app, owner, sectionId, domElem, {
                elementId: elementId,
                className: className
            })
            this.domElem.onsubmit = onsubmit
        }
    }

    constructor({
                    app = null,
                    owner = null,
                    domElem = null,
                    sectionId = null
                }) {
        super({app: app, owner: owner})
        if (owner) {
            this.sectionId = owner.sectionId
            this.app = owner.app
        } else if (sectionId)
            this.sectionId = sectionId
        this.domElem = domElem
    }

    htmlInputTextElement({
                             className = null,
                             elementId = null,
                             isPassword = null,
                             isTextArea = null,
                             isEmail = null,
                             maxLength = null,
                             onchange = null,
                             oninput = null,
                             readonly = null,
                             disabled = null,
                             refresh = null,
                             regExpAllowedChars = null,
                             required = null,
                             setUpperCase = null,
                             show = null,
                             trim = null,
                             value = null,
                         }) {
        let elem = new this.Cl_htmlInputTextElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                value: value,
                maxLength: maxLength,
                regExpAllowedChars: regExpAllowedChars,
                required: required,
                setUpperCase: setUpperCase,
                trim: trim,
                isPassword: isPassword,
                isTextArea: isTextArea,
                isEmail: isEmail,
                onchange: onchange,
                refresh: refresh,
                readonly: readonly,
                disabled: disabled,
                oninput: oninput,
                show: show,
            })
        return elem.getElement()
    }

    htmlInputHiddenElement({
                               elementId = null,
                               className = null,
                               refresh = null,
                               onchange = null
                           }) {
        let elem = new this.Cl_htmlInputHiddenElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                refresh: refresh,
                onchange: onchange
            })
        return elem.getElement()
    }

    htmlInputRadioElement({
                              elementId = null,
                              className = null,
                              required = null,
                              checked = null,
                              onchange = null,
                              refresh = null
                          }) {
        let elem = new this.Cl_htmlInputRadioElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                required: required,
                checked: checked,
                onchange: onchange,
                refresh: refresh
            })
        return elem.getElement()
    }

    htmlInputCheckElement({
                              elementId = null,
                              className = null,
                              required = null,
                              onchange = null,
                              refresh = null,
                              checked = null
                          }) {
        let elem = new this.Cl_htmlInputCheckElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                required: required,
                checked: checked,
                onchange: onchange,
                refresh: refresh
            })
        return elem.getElement()
    }

    htmlInputSelectElement({
                               elementId = null,
                               className = null,
                               required = null,
                               onchange = null,
                               refresh = null,
                               items = null
                           }) {
        let elem = new this.Cl_htmlInputSelectElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                required: required,
                onchange: onchange,
                refresh: refresh
            })
        if (items)
            elem.domElem.setItemsFromArray(items)
        return elem.getElement()
    }

    htmlInputCurrencyElement({
                                 elementId = null,
                                 className = null,
                                 value = null,
                                 minValue = null,
                                 maxValue = null,
                                 required = null,
                                 onchange = null,
                                 refresh = null
                             }) {
        let elem = new this.Cl_htmlInputCurrencyElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                value: value,
                minValue: minValue,
                maxValue: maxValue,
                required: required,
                onchange: onchange,
                refresh: refresh
            })
        return elem.getElement()
    }

    htmlElement({
                    elementId = null,
                    className = null,
                    innerHTML = null,
                    value = null,
                    refresh = null,
                    setClasses = null,
                    show = null,
                    optional = null
                }) {
        let elem = new this.Cl_htmlElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                innerHTML: innerHTML,
                value: value,
                refresh: refresh,
                setClasses: setClasses,
                show: show,
                optional: optional
            })
        return elem.getElement()
    }

    htmlTextElement({
                        elementId = null,
                        className = null,
                        innerHTML = null,
                        refresh = null,
                        show = null
                    }) {
        let elem = new this.Cl_htmlTextElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                innerHTML: innerHTML,
                refresh: refresh,
                show: show
            })
        return elem.getElement()
    }

    htmlImgElement({
                       elementId = null,
                       className = null,
                       src = null,
                       refresh = null
                   }) {
        let elem = new this.Cl_htmlImgElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                src: src,
                refresh: refresh
            })
        return elem.getElement()
    }

    htmlButtonElement({
                          elementId = null,
                          className = null,
                          setClasses = null,
                          init = null,
                          innerHTML = null,
                          onclick = null,
                          refresh = null,
                          show = null,
                          disabled = null,
                          optional = null,
                      }) {
        let elem = new this.Cl_htmlButtonElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                setClasses: setClasses,
                init: init,
                innerHTML: innerHTML,
                onclick: onclick,
                refresh: refresh,
                show: show,
                disabled: disabled,
                optional: optional
            })
        return elem.getElement()
    }

    htmlFormElement({
                        elementId = null,
                        className = null,
                        onsubmit = null
                    }) {
        let elem = new this.Cl_htmlFormElement(
            this.app, this, this.sectionId, this.domElem, {
                elementId: elementId,
                className: className,
                onsubmit: onsubmit
            })
        return elem.getElement()
    }
}

class Cl_domRepeater extends Cl_domSection {
    Cl_domElemRepeat = class extends Cl_domSection {
        /**
         * @param app
         * @param owner: la sección del document, con funcionalidades. Ej: htmlInputElement.getElement
         * @param domElemRepeat: se toma del primer elemento existente en el repetidor, tmpltItemRepeater
         */
        constructor({owner, domElemRepeat}) {
            if (!domElemRepeat) {
                alert('No se indicó el domElemRepeat')
                throw new Error(`No se indicó el domElemRepeat`)
            }
            super({
                app: owner.app,
                owner: owner,
                domElem: domElemRepeat
            })
            this.domElemRepeat = domElemRepeat
        }
    }

    /*
    * domElem: el elemento contenedor repetidor
    * domItemRepeater: el elemento que se repite
    * > domItemRepeater se toma del único hijo de domElem, luego se borra
    */
    constructor({owner, domRepeaterId, domRepeaterClass}) {
        super({
            app: owner.app,
            owner: owner
        })
        this.domElem = owner.htmlElement({
            elementId: domRepeaterId,
            className: domRepeaterClass
        })
        this.tmpltItemRepeater = this.domElem.firstElementChild.cloneNode(true)
        while (this.domElem.children.length)
            this.domElem.firstElementChild.remove()
        this.collectionItems = []
    }

    add(itemObject, itemId, itemPosition) {
        let newDivItem = this.tmpltItemRepeater.cloneNode(true)
        this.domElem.appendChild(newDivItem)
        this.collectionItems.push(
            this.instanceNewItemRepeat({
                newDivItem: newDivItem,
                itemObject: itemObject,
                itemId: itemId,
                itemPosition: itemPosition
            })
        )
    }

    instanceNewItemRepeat({
                              newDivItem = null,
                              itemObject = null,
                              itemId = null,
                              itemPosition = null
                          } = {}) {
        // alert('Cree la instancia "instanceNewItemRepeat" en la subclase')
        // throw new Error('Cree la instancia "instanceNewItemRepeat" en la subclase')
        // return {}
    }

    clear() {
        let nElem = this.collectionItems.length
        for (let elem = 0; elem < nElem; elem++) {
            this.collectionItems[0].domElemRepeat.remove()
            // this.collectionItems[0].domElemRepeat.destroy() // todo: Implementar este método
            this.collectionItems.splice(0, 1)
        }
    }

    chargeItems(itemsObject) {
        this.clear()
        let itemPosition = 0
        for (let itemId in itemsObject)
            this.add(itemsObject[itemId], itemId, itemPosition++)
    }

    refresh() {
        super.refresh()
        for (let item in this.collectionItems)
            this.collectionItems[item].refresh()
    }
}

class Cl_guiModal extends Cl_domSection {
    // todo: retomar el focus al modal cuando regrese de otras ventanas, para que retome la captura de teclas: ej. Escape
    __Cl_btClose = class extends this.Cl_htmlButtonElement {
        constructor({app, owner, btCloseId}) {
            super(app, owner, owner.sectionId, null, {
                elementId: btCloseId
            })
            let oi = this
            this.domElem.addEventListener('click', function (e) {
                oi.onclick.call(oi)
            })
            this.domElem.refresh = function () {
                oi.refresh()
            }
            this.owner.fieldSet.onkeydown = function (e) {
                if (oi.domElem.visible() && e.keyCode === 27) { //enter key code
                    oi.onclick()
                }
            }
        }

        onclick(onHide) {
            let oi = this
            if (onHide)
                this.owner.domModal.on('hidden.bs.modal', function () {
                    oi.owner.domModal.off('hidden')
                    onHide()
                })
            this.owner.hide()
            if (this.owner.functionOnCancel)
                this.owner.functionOnCancel()
        }

        refresh() {
        }
    }

    Cl_btClose = class extends this.__Cl_btClose {
    }

    __Cl_btOk = class extends this.Cl_htmlButtonElement {
        constructor({app, owner, btOkId}) {
            super(app, owner, owner.sectionId, null, {elementId: btOkId})
            let oi = this
            this.owner.fieldSet.addEventListener('keydown', function (e) {
                if (e.keyCode === 13) //enter key code
                    oi.onclick.call(oi, e)
            })
            this.domElem.addEventListener('click', function (e) {
                oi.onclick.call(oi, e)
            })
            this.domElem.refresh = function () {
                oi.refresh()
            }
        }

        checkValidityAndGo(e) {
            if (!owner.form.checkValidity()) {
                e.preventDefault()
                owner.form.reportValidity()
            } else this.onclick()
        }

        onclick(e = null) {
            if (!this.owner.form.checkValidity()) {
                e.preventDefault()
                this.owner.form.reportValidity()
            }
        }

        refresh() {
        }
    }

    Cl_btOk = class extends this.__Cl_btOk {
        onclick(e = null) {
            super.onclick(e)
            if (this.owner.btClose)
                this.owner.btClose.click()
        }
    }
    __ClSpinner = class {
        constructor(owner) {
            let div1 = document.createElement('div')
            div1.id = `${owner.sectionId}_spinner`
            owner.form.children[0].children[0].children[0].children[2].append(div1)
            this.domElem = owner.htmlElement({
                elementId: 'spinner',
                innerHTML:
                    '<div class="gooey">' +
                    '   <span class="visually-hidden">Loading...</span>\n' +
                    '   <span class="dot"></span>\n' +
                    '   <div class="dots">\n' +
                    '      <span></span> <span></span> <span></span>\n' +
                    '   </div>\n' +
                    '</div>\n',
                setClasses: {
                    add: ['spinner-modal']
                }
            })
            let oi = this
            this.show = function (show = true, disabled = true) {
                oi.domElem.show(show)
                owner.fieldSet.disabled = Boolean(disabled)
            }
            this.hide = function (functionOnResult = function () {
            }) {
                oi.domElem.show(false)
                owner.fieldSet.disabled = false
                functionOnResult()
            }
        }
    }

    constructor({
                    app,
                    owner,
                    sectionId,
                    btOkId = null,
                    btCloseId = null,
                    onShowFocusElemId = null
                } = {btOkId: null, btCloseId: null}) {
        super({app: app, owner: owner, sectionId: sectionId})
        this.lastFocusedElement = null
        this.fieldSet = this.htmlElement({
            elementId: 'fieldSet',
        })
        this.form = this.htmlFormElement({
            elementId: 'form',
        })
        this.form.addEventListener('submit', function (e) {
            e.preventDefault()
        })
        this.spinner = new this.__ClSpinner(this)
        this.domModal = bootstrap.Modal.getOrCreateInstance(document.getElementById(`${sectionId}_modal`))
        if (btOkId)
            this.btOk = this.new_btOk(btOkId)
        if (btCloseId)
            this.btClose = this.new_btClose(btCloseId)
        if (onShowFocusElemId)
            this.onShowFocusElemId = this.htmlElement({
                elementId: onShowFocusElemId
            })
        this.functionOnResult
            = this.functionOnCancel
            = this.elementFocusOnClose = null
        // Set onShow modal functionality
        let oi = this
        document.getElementById(`${sectionId}_modal`).addEventListener(
            'shown.bs.modal',
            function (e) {
                oi.onShow.call(oi)
            })
        document.getElementById(`${sectionId}_modal`).addEventListener(
            'hidden.bs.modal',
            function (e) {
                if (oi.elementFocusOnClose)
                    oi.elementFocusOnClose.focus()
            })
        // Habilita el modal-body para el focus(), y permitir reactivar la tecla escape al activar y volver de otras ventanas
        this.modalBody = this.domModal._element.children[0].children[0].children[1]
        this.modalBody.setAttribute('tabindex', '-1')
    }

    new_btClose(btCloseId) {
        let elem = new this.Cl_btClose({
            app: this.app,
            owner: this,
            btCloseId: btCloseId,
        })
        return elem.getElement()
    }

    new_btOk(btOkId) {
        let elem = new this.Cl_btOk({
            app: this.app,
            owner: this,
            btOkId: btOkId,
        })
        return elem.getElement()
    }

    hide() {
        this.domModal.hide()
        this.lastFocusedElement.focus()
    }

    onShow() {
        this.spinner.hide()
        this.modalBody.focus()
        if (this.onShowFocusElemId) {
            this.onShowFocusElemId.focus()
            this.onShowFocusElemId.select()
        }
    }

    show({
             functionOnResult = null,
             functionOnCancel = null,
             elementFocusOnClose = null
         } = {
             functionOnResult: null,
             functionOnCancel: null,
             elementFocusOnClose: null
         }
    ) {
        this.spinner.show()
        this.lastFocusedElement = document.activeElement
        this.functionOnResult = functionOnResult ?? function () {
        }
        this.functionOnCancel = functionOnCancel ?? function () {
        }
        this.elementFocusOnClose = elementFocusOnClose ?? null
        this.domModal.show()
    }
}

class Cl_guiCroppie extends Cl_object {
    constructor({
                    app = null,
                    owner = null,
                    imageContainer = null,
                    boundaryLength = 25
                }) {
        super({app, owner: owner})
        this.imageContainer
            = this.imageContainerOriginal
            = imageContainer
        this.boundaryLength = boundaryLength
        this.croppieWidth = this.imageContainer.width
        this.croppieHeight = this.imageContainer.height
        this.originalWidth = null
        this.originalHeight = null
        this.imageSrc = null
    }

    get imageSrc() {
        return this._imageSrc
    }

    set imageSrc(imgSrc) {
        if (!imgSrc)
            this._imageSrc = imgSrc
        else {
            this.imageContainer.src = imgSrc
            let oi = this
            if (!this._imageSrc)
                this.imageContainer.onload = function () {
                    oi.originalWidth = oi.imageContainer.naturalWidth
                    oi.originalHeight = oi.imageContainer.naturalHeight
                    let newWidth = oi.croppieWidth, newHeight = oi.croppieHeight
                    if (oi.imageContainer.width > oi.imageContainer.height)
                        newHeight = oi.imageContainer.height * newWidth / oi.imageContainer.width
                    else
                        newWidth = oi.imageContainer.width * newHeight / oi.imageContainer.height
                    oi._imageSrc = new Croppie(oi.imageContainer, {
                        viewport: {width: newWidth, height: newHeight},
                        boundary: {width: newWidth + oi.boundaryLength, height: newHeight + oi.boundaryLength},
                        showZoomer: true,
                        // enableResize: true,
                        // enableOrientation: true,
                        mouseWheelZoom: 'ctrl',
                        enforceBoundary: true,
                        zoom: 0
                    })
                    oi.imageContainer.onload = null
                }
            else this.imageSrc.bind({
                url: imgSrc,
                zoom: 0
            })
        }
    }

    setButtonLoader(button) {
        let fileReader = new FileReader()
        let oi = this
        fileReader.onload = function () {
            oi.imageSrc = this.result
            button.value = null
        }
        button.onchange = function () {
            fileReader.readAsDataURL(button.files[0])
            oi.onchange()
        }
    }

    onchange() {
    }

    onupdate(ev) {
        // alert('Éxito')
    }

    newImageSrc(functionResult) {
        this.imageSrc.result({
                type: 'base64',
                size: {
                    width: this.originalWidth,
                    height: this.originalHeight
                },
                format: 'jpeg',
                quality: 0.95
            }
        ).then(function (newImageBase64) {
            functionResult(newImageBase64)
        })
    }

    destroy() {
        if (this.imageSrc) {
            this.imageSrc.destroy()
            this.imageSrc = null
        }
    }

    show(imgSrc) {
        this.destroy()
        this.imageSrc = imgSrc
    }
}

class Cl_guiProgressBar extends Cl_object {
    constructor({app, owner = null, domElem}) {
        super({app, owner: owner})
        this.domElem = domElem
        this.value = 0
    }

    set value(value) {
        if (value === 0)
            this.domElem.classList.add('d-none')
        else this.domElem.classList.remove('d-none')
        this.domElem.children[0].style.width = `${value}%`
        this.domElem.children[0].setAttribute('aria-valuenow', value)
        this.domElem.children[0].children[0].innerHTML = `${value}%`
    }
}

class Cl_infoModal extends Cl_guiModal { // infoModal
    constructor({app}) {
        super({
            app: app,
            sectionId: 'infoModal',
            btOkId: 'btOk',
            btCloseId: 'btClose',
        })
        this.divInfoContent = this.htmlElement({
            elementId: 'divInfoContent',
        })
    }

    show({divInfoContent}) {
        super.show()
        this.divInfoContent.innerHTML = divInfoContent
    }
} // infoModal
