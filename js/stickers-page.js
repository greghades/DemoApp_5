class Cl_sCookies extends Cl_cookies {
    /** @returns object
     * stickerData = {
     *    name: '',
     *    inMotto: '',
     *    logoSrc: '',
     *    qrText: ''
     * }
     */
    get stickerData() {
        return JSON.parse(this.get('stickerData'))
    }
}

class Cl_stickersSection extends Cl_domSection {
    stickerData = {
        name: '',
        motto: '',
        logoSrc: '',
        qrText: '',
    }
    Cl_divItems = class extends Cl_domRepeater {
        Cl_divItem = class extends this.Cl_domElemRepeat {
            constructor(owner, domElemRepeat, itemId, itemPosition, sticker) {
                super({owner: owner, domElemRepeat: domElemRepeat})
                this.imglogo = this.htmlImgElement({
                    className: 'imgLogo',
                    src: sticker.logoSrc
                })
                this.lblName = this.htmlTextElement({
                    className: 'lblName',
                    innerHTML: sticker.name,
                })
                this.lblMotto = this.htmlTextElement({
                    className: 'lblMotto',
                    innerHTML: sticker.motto,
                })
                this.divQr = this.htmlTextElement({
                    className: 'divQr',
                    innerHTML: ''
                })
                new QRCode(this.divQr, {
                    text: sticker.qrText,
                    width: sticker.sideMeasure,
                    height: sticker.sideMeasure,
                })
            }
        }

        instanceNewItemRepeat({
                                  newDivItem = null,
                                  itemId = null,
                                  itemObject = null,
                                  itemPosition = null
                              }) {
            return new this.Cl_divItem(this.owner, newDivItem, itemId, itemPosition, itemObject)
        }
    }

    constructor({app, sectionId, stickerData, sideMeasure, repeatCnt}) {
        super({
            app: app,
            sectionId: sectionId
        })
        this.stickerData = stickerData
        this.stickerData.sideMeasure = sideMeasure
        this.repeatCnt = repeatCnt
        this.divItems = new this.Cl_divItems({
            owner: this,
            domRepeaterId: `divStickers`,
        })
    }

    onload() {
        let sticker = this.stickerData,
            stickersArray = []
        for (let i = 0; i < this.repeatCnt; i++)
            stickersArray.push(sticker)
        this.divItems.chargeItems(stickersArray)
        window.print()
    }
}

class Cl_easyRestoranAPP extends Cl_app {
    stickersMeasures = {
        largeSticker: 130,
        smallSticker: 90
    }

    constructor() {
        super()
        this.cookies = new Cl_sCookies({app: this})
        this.stickers1 = new Cl_stickersSection({
            app: this,
            sectionId: 'stickers1',
            stickerData: this.cookies.stickerData,
            sideMeasure: this.stickersMeasures.largeSticker,
            repeatCnt: 2,
        })
        this.stickers2 = new Cl_stickersSection({
            app: this,
            sectionId: 'stickers2',
            stickerData: this.cookies.stickerData,
            sideMeasure: this.stickersMeasures.smallSticker,
            repeatCnt: 12,
        })
        let oi = this
        document.onreadystatechange = () => {
            if (document.readyState === 'complete') {
                oi.onload()
            }
        }
    }
}

let easyRestoranAPP = new Cl_easyRestoranAPP()
