class Cl_optionsPanel extends Cl_domSection { // optionsPanel: Panel de opciones
    constructor({app}) {
        super({app: app, sectionId: 'optionsPanel'})
        this.btStaff = this.htmlButtonElement({
            elementId: 'btStaff',
            onclick() {
                this.app.staffModal.show()
            }
        })
    }
}

class Cl_staffModal extends Cl_guiModal { // staffModal
    Cl_divItems = class extends Cl_domRepeater {
        Cl_divItem = class extends this.Cl_domElemRepeat {
            constructor(owner, domElemRepeat, itemId, itemPosition, staff) {
                super({owner: owner, domElemRepeat: domElemRepeat})
                this.lblLogin = this.htmlTextElement({
                    className: 'lblTitle',
                    innerHTML: staff.title,
                })
                this.lblFullname = this.htmlTextElement({
                    className: 'lblDate',
                    innerHTML: staff.date,
                })
                this.lblRolName = this.htmlTextElement({
                    className: 'lblStatus',
                    innerHTML: staff.status,
                })
            }
        }

        constructor({owner}) {
            super({
                owner: owner,
                domRepeaterId: 'divItems'
            })
        }

        instanceNewItemRepeat({
                                  newDivItem = null,
                                  itemId = null,
                                  itemObject = null,
                                  itemPosition = null
                              }) {
            return new this.Cl_divItem(this.owner, newDivItem, itemId, itemPosition, itemObject)
        }

        refresh() {

            this.app.easyUtil.modelDo(
                this, {
                    phpURL: 'forms/data.php',
                    ajaxResult(result) {
                        this.chargeItems(result.items)
                    }
                })

            //this.chargeItems(data.items)
        }
    }

    constructor({app}) {
        super({
            app: app,
            sectionId: 'staffModal',
            btCloseId: 'btClose'
        })
        this.divItems = new this.Cl_divItems({owner: this})
    }

    show({} = {}) {
        super.show()
        this.divItems.refresh()
    }
} // staffModal

class Cl_easyRestoranAPP extends Cl_app {
    constructor() {
        super()
        this.optionsPanel = new Cl_optionsPanel({app: this})
        this.staffModal = new Cl_staffModal({app: this})
        let oi = this
        document.onreadystatechange = () => {
            if (document.readyState === 'complete') {
                oi.onload()
            }
        }
    }

    refresh() {
        if (this.appUser.userIsLogged) {
            let oi = this
            this.menu.loadFromBackend(function () {
                oi.refresh1()
            })
        } else {
            if (this.appUser.userBeforeLogged)
                alert('Se ha perdido la sesión. Tal vez inició sesión en otro dispositivo.')
            if (this.urlParams.get('op') === 'signUp')
                this.registerModal.show()
            else if (this.urlParams.get('signUp') === 'google')
                this.appUser.googleSignUp()
            else this.loginModal.show()
        }
    }

    refresh1() {
        super.refresh()
        let today = new Date()
        today = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
        if (this.menu.restaurant.appReviewCnt === 0 &&
            this.menu.restaurant.daysFromRegister > 2 &&
            this.menu.restaurant.lastDayAppReview !== today)
            this.appReview.show()
    }
}

let easyRestoranAPP = new Cl_easyRestoranAPP()
