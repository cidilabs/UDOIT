var ResultsFilter = {
    contentTypes: [],
    issues: {},
    context: '#scanner',
    container: '.results-wrapper',
    filters: {
        issueType: [],
    },

    init: function() {
        console.log('Filter script started.');

        this.scanContent();
        this.reorganizeContent();
        this.renderFilters();
        this.setUpFilterActions();

        $('section#result', this.context).remove();

        this.scrollToResults();
    },
    scrollToResults: function() {
        $([document.documentElement, document.body]).animate({
            scrollTop: $(this.container).offset().top
        }, 1000);
    },
    scanContent: function() {
        let _this = this;
        this.contentTypes = {};

        $('h2.content-title', this.context).each(function(i, obj) {
            let title = $(obj).clone().children().remove().end().text().replace(/ /g,'');

            while ($(obj).next('div.errorItem').length > 0) {
                obj = $(obj).next('div.errorItem');
                if (!Array.isArray(_this.contentTypes[title])) {
                    _this.contentTypes[title] = [];
                }

                _this.contentTypes[title].push(obj);
                console.log(obj);
            }
        });

        _this.oldHtml = $('section#result', this.context);
    },
    renderFilters: function() {
        
    },
    reorganizeContent: function() {
        this.addHtmlStructure();
        this.moveReportSummary();
        this.moveReportTitle();
        this.moveReportPdfButton();
        this.addContentTypeTabs();
    },
    addHtmlStructure: function() {
        $(this.container, this.context).remove();

        let html = `
            <div class="${this.container.replace('.','')}">
                <div class="results-tabs-wrapper row">
                    <div class="col-sm-3">
                        <ul class="results-tabs nav nav-pills nav-stacked" role="tablist">
                            <li role="presentation" class="active">
                                <a href="#summary" aria-controls="summary" role="tab" data-toggle="tab">Summary</a>
                            </li>
                        </ul>
                    </div>
                    <div class="col-sm-9 results-panes tab-content">
                        <div role="tabpanel" class="tab-pane active" id="summary"></div>
                    </div>
                </div>
            </div>
        `;

        $(this.context).append(html);
    },
    moveReportSummary: function() {
        let errorSummary = $('#errorTotalSummary .errorSummary').clone(true);
        $('#summary', this.context).append(errorSummary);
    },
    moveReportTitle: function() {
        let reportTitle = $('section#result h1').clone(true);
        $(this.container).prepend(reportTitle);
    },
    moveReportPdfButton: function() {
        $('button#savePdf').wrap(`<div class="save-pdf-wrapper"></div>`);

        $('#summary', this.context).append($('.save-pdf-wrapper').clone(true));
    },
    addContentTypeTabs: function() {
        let tabsUl = $('ul.results-tabs');
        let contentPanes = $('.results-panes')

        let contentLabels = {
            'Files': 'HTML Files',
            'Unscannable': 'Unscannable Files',
        };
        console.log(contentLabels);

        for (let title in this.contentTypes) {
            let key = this.createTabKey(title);
            let contentArray = this.contentTypes[title];

            console.log('title', title);
            if (contentLabels.hasOwnProperty(title)) {
                console.log('matched', title);
                title = contentLabels[title];
            }

            let tabHtml = `
                <li role="presentation">
                    <a href="#${key}" aria-controls="${key}" role="tab" data-toggle="tab">
                        ${title}<small class="issue-count"></small></a>
                </li>
            `;
            tabsUl.append(tabHtml);

            let paneHtml = `
                <div role="tabpanel" class="tab-pane" id="${key}"></div>
            `;
            contentPanes.append(paneHtml);
            contentArray.forEach((item) => {
                $(`#${key}.tab-pane`).append(item);
            });
            
        }
    },

    setUpFilterActions: function() {
        $('.results-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })
    },
    createTabKey: function(key) {
        return 'udoit-' + key.replace(/ /g, '').toLowerCase();
    }
}
