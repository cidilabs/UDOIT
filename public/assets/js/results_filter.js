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
        this.renderFilters();
        this.reorganizeContent();
        this.setUpFilterActions();

        $('#result').hide();
        this.scrollToResults();
    },
    scrollToResults: function() {
        $([document.documentElement, document.body]).animate({
            scrollTop: $(this.context).offset().top
        }, 1000);
    },
    scanContent: function() {
        let _this = this;

        $('h2.content-title', this.context).each(function(i, obj) {
            let title = $(obj).clone().children().remove().end().text();
            let content = $(obj).next('div.errorItem');

            if (content.length > 0) {
                _this.contentTypes[title] = content;
            }
        });
    },
    renderFilters: function() {
        
    },
    reorganizeContent: function() {
        this.addHtmlStructure();
        this.moveReportSummary();
        this.moveReportTitle();
        this.moveReportPdfButton();

    },
    addHtmlStructure: function() {
        let html = `
            <div class="results-wrapper row">
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
        `;

        $(this.context).append(html);
    },
    moveReportSummary: function() {
        let errorSummary = $('#errorTotalSummary .errorSummary').html();
        $('#summary', this.context).append(errorSummary);
    },
    moveReportTitle: function() {

    },
    moveReportPdfButton: function() {

    },

    setUpFilterActions: function() {

    }
}
