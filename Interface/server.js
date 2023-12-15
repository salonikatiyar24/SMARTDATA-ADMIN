const sc = {
    service:{
        DOMHandlers:{},
        events:{}
    },
    server:{}
};

sc.service.request = function(endpoint,method,data={},callback=()=>{}) {
    const contentType = 'application/json';
    $.ajax({
        url:endpoint,
        method:method,
        contentType:contentType,
        data:JSON.stringify(data),
    }).done(
        (data) => {callback(data)}
    ).fail(
        (err) => {alert(JSON.stringify(err))}
    )

};

sc.service.DOMHandlers.createTableRow = function(ipName,ipStart,ipEnd) {
    const uuid = crypto.randomUUID();
    let tds = [
        `<td><input class='ruleData ruleName' onfocusout='sc.service.events.ruleUpdated(this)' value='${ipName}' data-orig='${ipName}' /></td>`,
        `<td><input class='ruleData' onfocusout='sc.service.events.ruleUpdated(this)' value='${ipStart}' data-orig='${ipStart}'/></td>`,
        `<td><input class='ruleData' onfocusout='sc.service.events.ruleUpdated(this)' value='${ipEnd}' data-orig='${ipEnd}'/></td>`,
        `<td><button class='resetBtn' onclick="sc.service.DOMHandlers.resetRow(this)" disabled>Reset</button></td>`,
        `<td><button class='deleteBtn' onclick="sc.service.DOMHandlers.toggleDelete(this)">Toggle Delete</button></td>`
    ];
    const tr = `<tr>${tds.join('')}</tr>`

    return tr
};

sc.service.DOMHandlers.resetRow = function(evt) {
    const tr = $(evt).closest('tr');
    const inputs = tr.find('input');
  
    inputs.each(function() {
        $(this).val($(this).data('orig'));
    });

    sc.service.DOMHandlers.updateRowState(tr);
};

sc.service.DOMHandlers.toggleDelete = function(evt) {
    const tr = $(evt).closest('tr');
    const inputs = tr.find('input');
  
    if (tr.data('state') != 'deletedRow') {
        sc.service.DOMHandlers.updateRowState(tr,'deletedRow');
        inputs.each(function() { $(this).prop('disabled',true); });
    } else {
        sc.service.DOMHandlers.updateRowState(tr);
        inputs.each(function() { $(this).prop('disabled',false); });
    }

};

sc.service.DOMHandlers.checkRowChangedState = function(tr) {
    const inputs = tr.find('input');
    const button = tr.find('button');

    let allMatch = true;

    inputs.each(function() {
        if ($(this).val() !== $(this).data('orig')) {
            allMatch = false;
            return false;
        } 
    });

    if (allMatch) {
        sc.service.DOMHandlers.updateRowState(tr);
        button.prop('disabled',true);
    } else {
        sc.service.DOMHandlers.updateRowState(tr,'changedRow');
        button.prop('disabled',false);
    }
};

sc.service.DOMHandlers.updateRowState = (tr, state) => {
    const states = ['changedRow', 'deletedRow', 'addedRow'];

    states.forEach((s) => tr.removeClass(s));

    if (states.includes(state)) {
        tr.data('state',state)
        tr.addClass(state);
    } else { tr.removeData('state'); }
};

sc.service.events.ruleUpdated = function(evt) {
    const tr = $(evt).closest('tr');

    sc.service.DOMHandlers.checkRowChangedState(tr);
};

sc.server.refreshFirewallRules = function() {
    const contentType = 'application/json';
    $.ajax({
        url:'/refreshFirewallRules',
        method:'GET',
        contentType:contentType,
    }).done((data) => {
        const currRulesBody = $('table#currentRules>tbody');
        bodyContent = data.map((e) => { return sc.service.DOMHandlers.createTableRow(e.name,e.start,e.end); })
            .sort((a,b) => a.localeCompare(b)).join('');

        currRulesBody.html(bodyContent)
    });
};

sc.server.commitFirewallRules = function() {
    alert("This is where there'll be code to update the firewall rules");
};


$(document).ready(() => {
    sc.server.refreshFirewallRules();
});