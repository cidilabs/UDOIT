/**
 * scriptTag = document.createElement("script"); scriptTag.setAttribute("src", "https://udoit3.ciditools.com/update.js"); document.body.appendChild(scriptTag);
*/

UdoitUpdate = {
    init: function () {
        console.log('Starting...');
        this.checkRootAccount();
        this.checkSubAccounts();
    },
    getUrlBase: function () {
        return 'https://' + window.location.host + '/api/v1/';
    },
    canvasApiGet: function (action) {
        let urlBase = this.getUrlBase();

        return fetch(urlBase + action, {
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json',
            }
        });
    },
    canvasApiPut: function (action) {
        let urlBase = this.getUrlBase();
        
        console.log('Updating UDOIT configuration: ' + action);

        let formData = {
            'course_navigation[visibility]': 'admins'
        };

        $.ajax({
            'url': urlBase + action,
            'type': 'PUT',
            'data': formData
        })
            .done(function (results) {
                console.log('Tool updated.');
            });
    },
    checkRootAccount: function()
    {
        let action = 'accounts/self';
        let _this = this;

        this.canvasApiGet(action)
            .then((response) => {
                return response.text();
            })
            .then((mytext) => {
                let accountsStr = mytext.replace('while(1);', '');
                let account = JSON.parse(accountsStr);

                _this.checkExternalTools(account);
            });
    },
    checkSubAccounts: function (page) {
        let action = 'accounts/self/sub_accounts?recursive=true&per_page=100';
        let _this = this;

        if (page) {
            action += `&page=${page}`;
        }
        else {
            page = 1;
        }

        this.canvasApiGet(action)
            .then((response) => {
                return response.text();
            })
            .then((mytext) => {
                let accountsStr = mytext.replace('while(1);', '');
                let accounts = JSON.parse(accountsStr);

                for (let account of accounts) {
                    _this.checkExternalTools(account);
                }

                if (accounts.length > 0) {
                    page++;
                    this.checkSubAccounts(page);
                }
                else {
                    console.log('Done.');
                }
            });
    },
    
    checkExternalTools: function (account, page) {
        let action = `accounts/${account.id}/external_tools?per_page=100`;

        if (page) {
            action += `&page=${page}`;
        }
        else {
            page = 1;
        }

        this.canvasApiGet(action)
            .then((response) => {
                return response.text();
            })
            .then((resultStr) => {
                let toolsStr = resultStr.replace('while(1);', '');
                let tools = JSON.parse(toolsStr);

                for (let tool of tools) {
                    if (!tool.domain || !tool.domain.includes('udoit3.ciditools.com')) {
                        continue;
                    }
                    if (!tool.url || !tool.url.includes('udoit3.ciditools.com')) {
                        continue;
                    }
                    this.updateExternalTool(account, tool);
                }

                if (tools.length > 0) {
                    page++;
                    this.checkExternalTools(account, page);
                }
            });
    },
    updateExternalTool: function (account, tool) {
        action = `accounts/${account.id}/external_tools/${tool.id}`;

        let okay = confirm(`Are you sure you want to update the UDOIT configuration for account #${account.id}?`)
        if (okay) {
            this.canvasApiPut(action);
        }
    }
}

UdoitUpdate.init();
