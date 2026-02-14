* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1a1a1a;
}

.header {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #0066cc;
}

.header-content {
    display: table;
    width: 100%;
}

.company-info {
    display: table-cell;
    width: 50%;
    vertical-align: top;
}

.document-info {
    display: table-cell;
    width: 50%;
    text-align: right;
    vertical-align: top;
}

.company-logo {
    max-width: 150px;
    max-height: 80px;
    margin-bottom: 10px;
}

.company-name {
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 5px;
}

.company-details {
    font-size: 9pt;
    color: #666666;
    line-height: 1.4;
}

.document-title {
    font-size: 24pt;
    font-weight: bold;
    color: #0066cc;
    margin-bottom: 5px;
}

.po-number {
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 3px;
}

.issue-date {
    font-size: 9pt;
    color: #666666;
}

h2 {
    font-size: 14pt;
    font-weight: bold;
    margin: 15px 0 10px 0;
    color: #0066cc;
}

h3 {
    font-size: 11pt;
    font-weight: bold;
    margin: 10px 0 5px 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
}

table.info-table td {
    padding: 5px;
    border: none;
}

table.info-table td:first-child {
    width: 30%;
    font-weight: bold;
    color: #666666;
}

table.items-table {
    border: 1px solid #cccccc;
}

table.items-table th {
    background-color: #f5f5f5;
    font-weight: bold;
    padding: 8px;
    border: 1px solid #cccccc;
    text-align: left;
}

table.items-table td {
    padding: 8px;
    border: 1px solid #e0e0e0;
    vertical-align: top;
}

table.items-table tr:nth-child(even) {
    background-color: #fafafa;
}

.specifications {
    font-size: 9pt;
    color: #666666;
    line-height: 1.4;
}

.specifications-item {
    margin: 2px 0;
}

.price-summary {
    width: 50%;
    margin-left: auto;
    margin-top: 10px;
}

.price-summary td {
    padding: 5px;
}

.price-summary td:first-child {
    text-align: right;
    padding-right: 20px;
}

.price-summary td:last-child {
    text-align: right;
    font-weight: bold;
}

.total-row {
    background-color: #e8f4f8;
    font-size: 12pt;
    font-weight: bold;
    border-top: 2px solid #0066cc;
}

.terms-section {
    margin-top: 20px;
    font-size: 9pt;
}

.terms-section h3 {
    font-size: 11pt;
    margin: 10px 0 5px 0;
}

.terms-section ul {
    margin-left: 20px;
}

.terms-section li {
    margin: 3px 0;
}

.signature-section {
    margin-top: 30px;
}

.signature-table {
    width: 100%;
}

.signature-table td {
    width: 50%;
    text-align: center;
    vertical-align: top;
    padding: 10px;
}

.signature-line {
    border-top: 1px solid #000;
    margin: 50px 20px 5px 20px;
}

.signature-name {
    font-weight: bold;
    margin-top: 5px;
}

.signature-position {
    font-size: 9pt;
    color: #666666;
}

.footer {
    position: fixed;
    bottom: 0;
    width: 100%;
    text-align: center;
    font-size: 8pt;
    color: #666666;
    border-top: 1px solid #cccccc;
    padding-top: 5px;
}

.page-number:after {
    content: counter(page);
}

.vendor-section {
    margin: 15px 0;
    padding: 10px;
    background-color: #f9f9f9;
    border: 1px solid #e0e0e0;
}

.vendor-title {
    font-size: 12pt;
    font-weight: bold;
    margin-bottom: 8px;
    color: #0066cc;
}

.text-right {
    text-align: right;
}

.text-bold {
    font-weight: bold;
}

.mt-10 {
    margin-top: 10px;
}

.mb-10 {
    margin-bottom: 10px;
}
