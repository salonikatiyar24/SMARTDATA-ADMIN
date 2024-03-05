if (typeof sdAdmin === 'undefined') { sdAdmin = {} };

sdAdmin.sftpUserMgr = {};

sdAdmin.sftpUserMgr.listSftpUsers = function(notify) {
    $('*').css('cursor','wait')
    $('button#sftpUserRefreshBtn').prop('disabled', true);
    const contentType = 'application/json';
    $.ajax({
        url:'/sftpmgr',
        method:'GET',
        contentType:contentType,
    }).done((data) => {
        sdAdmin.sftpUserMgr.createTable(data,'div#sftpUsers');

        if (notify) {
            notifications.addCard('SFTP User List Refreshed','','Info');
        }
    }).always(() => {
        $('*').css('cursor','')
        $('button#sftpUserRefreshBtn').prop('disabled', false);
    });
};

sdAdmin.sftpUserMgr.createTable = function (data, tableContainer) {
    const container = $(tableContainer);
    container.children().remove();

    const table = $(
        "<table><thead><tr><th>Name</th><th>HomeDirectory</th></tr></thead><tbody></tbody></table>"
    );

    data.sort(function (a, b) {
        var nameA = a.Name.toUpperCase(); // ignore upper and lowercase
        var nameB = b.Name.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    });

    for (let i = 0; i < data.length; i++) {
        let r = data[i];
        const row = $(`<tr id='${btoa(r.ARN)}'>
                         <td class='sftp-name'>${r.Name.slice(5)}</td>
                         <td class='sftp-dir'>${r.HomeDirectory}</td>
                         <td><button onclick="sdAdmin.sftpUserMgr.retrievePassword(event)">
                           Retrieve Password</button></td>
                        <td><button onclick="sdAdmin.sftpUserMgr.createNewUserModal(event)">
                           Edit User</button></td>
                         </tr>`);

        if (i % 2 == 0) {
            row.addClass("logRowEven");
        } else {
            row.addClass("logRowOdd");
        }

        table.find('tbody').append(row);
    }
    container.append(table);
};

sdAdmin.sftpUserMgr.retrievePassword = function(event) {
    $('*').css('cursor','wait')
    // $('button#firewallCommitBtn').prop('disabled', true);
    const ARN_b64 = event.target.closest('tr').id;
    const contentType = 'application/json';

    const passphrase = window.prompt('Enter a passphrase here if you want retrieving the secret to require a passphrase or leave blank for none');
    const payload = {"ARN_b64":ARN_b64,"passphrase":passphrase};

    $.ajax({
        url:'/sftpmgr/secret',
        method:'POST',
        contentType:contentType,
        data:JSON.stringify(payload)
    }).done((data) => {
        notifications.addCard('Password Retrieved','OneTimeSecret.com Link','Info',data.secret_url);
    }).always(() => {
        $('*').css('cursor','')
        // $('button#firewallCommitBtn').prop('disabled', false);
    });
}

sdAdmin.sftpUserMgr.createNewUserModal = function(event) {
    if (event.target.id != 'sftpUserCreateBtn') 
        console.log('clicked a "update existing user button"')
    else 
        console.log('clicked the "create new user" button"')

    // disable all other buttons
    $('button:not([disabled]):not(.modal button)')
        .addClass('disabledByModal')
        .prop('disabled',true);

    const dirs = [];
    $('.sftp-dir').each((i, n) => {
        if (!dirs.map((d) => d.toLowerCase()).includes(n.innerText.toLowerCase())) 
            dirs.push(n.innerText);
    });
    dirs.sort();

    const modal = $('<div id="sftpNewUSer">')
        .addClass('modal')
    const nameDiv = $('<div>').append($('<span>').text('Username: '));
    const dirDiv = $('<div>').append($('<span>').text('Home Dir (case sensitive): '));
    const passDiv = $('<div>').append($('<span>').text('Password: '));
    const btnDiv = $('<div id="modalBtnDiv">');
    const nameInput = $('<input id="modal-input-name" class="rightAlign">').css('width','15em');
    const dirInput = $('<input id="modal-input-dir" class="rightAlign" list="existingSftpPathList">').css('width','15em');
    const datalist = $('<datalist id="existingSftpPathList">');
    const passSpan = $('<span class="rightAlign">');
    const passInput = $('<input  id="modal-input-pass" type="password">').css('width','11.8em');
    const showPassBtn = $('<button>')
        .text("👁")
        .css({'width':'1.6em','border':'none'})
        .on('click',sdAdmin.sftpUserMgr.togglePassVis);
    const randPassBtn = $('<button>')
        .text("🖉")
        .css({'width':'1.6em','border':'none'})
        .on('click',sdAdmin.sftpUserMgr.randPass);
    dirs.forEach((d) => {
        let opt = $('<option>').val(d);
        datalist.append(opt);
    })

    const submitBtn = $('<button>')
        .text('Submit');

    const cancelBtn = $('<button>')
        .text('Cancel')
        .on('click',sdAdmin.sftpUserMgr.modalCleanup);

    modal.append(
        nameDiv.append(nameInput),
        passDiv.append(passSpan.append(randPassBtn,showPassBtn,passInput)),
        dirDiv.append(dirInput,datalist),
        btnDiv.append(submitBtn,cancelBtn)
    );

    if (event.target.id != 'sftpUserCreateBtn') {
        const tr = event.target.closest('tr'); 
        modal[0].dataset.ARN_b64 = tr.id;
        nameInput[0].value = tr.querySelector('.sftp-name').innerText;
        dirInput[0].value = tr.querySelector('.sftp-dir').innerText;
        passInput[0].placeholder = 'Leave blank for no change';
        submitBtn.on('click',sdAdmin.sftpUserMgr.modalSubmitUpdate);
        nameInput.prop('disabled',true);
    } else 
        submitBtn.on('click',sdAdmin.sftpUserMgr.modalSubmitNew);

    $('#sftpUserManagement').find('#sftpNewUSer').remove();
    $('#sftpUserManagement').append(modal);
    document.body.style.overflow = 'hidden';
}

sdAdmin.sftpUserMgr.modalCleanup = function(event) {
    event.target.closest('.modal').remove();
    document.body.style.overflow = '';

    $('.disabledByModal')
        .prop('disabled',false)
        .removeClass('disabledByModal');
}

sdAdmin.sftpUserMgr.modalSubmitNew = function (event) {
    const submitErrorDiv = $('<div>').text('name or directory are missing!');
    const btnDiv = $(event.target).parent();
    const modal = $(event.target).closest('.modal');
    const nameInput = modal.find('#modal-input-name');
    const passInput = modal.find('#modal-input-pass');
    const dirInput  = modal.find('#modal-input-dir');


    if (nameInput.val() == '' || dirInput.val() == '') {
        submitErrorDiv.insertBefore(btnDiv);
    } else {
        let payload = {
            username: `SFTP/${nameInput.val()}`,
            password: passInput.val(),
            homedir: dirInput.val()
        }

        $('*').css('cursor', 'wait')
        $('.modal button').prop('disabled', true);
        const contentType = 'application/json';

        $.ajax({
            url: '/sftpmgr/create',
            method: 'POST',
            contentType: contentType,
            data: JSON.stringify(payload)
        }).done((data) => {
            notifications.addCard('New SFTP User Created', data.Name, 'Info');
            sdAdmin.sftpUserMgr.modalCleanup(event);
            sdAdmin.sftpUserMgr.listSftpUsers(false);
        }).fail((data) => {
            notifications.addCard('Something Went Wrong', 'Error creating SFTP user', 'error');
        }).always(() => {
            $('*').css('cursor', '')
            $('.modal button').prop('disabled', false);
        });
    }
}

sdAdmin.sftpUserMgr.modalSubmitUpdate = function (event) {
    const submitErrorDiv = document.createElement('div');
    submitErrorDiv.innerText = 'name or directory are missing!'
    const btnDiv = event.target.parentNode;
    const modal = event.target.closest('.modal');
    const nameInput = modal.querySelector('#modal-input-name');
    const passInput = modal.querySelector('#modal-input-pass');
    const dirInput  = modal.querySelector('#modal-input-dir');

    if (nameInput.value == '' || dirInput.value == '') {
        btnDiv.parentNode.insertBefore(submitErrorDiv,btnDiv);
    } else {
        let payload = {
            ARN_b64: modal.dataset.ARN_b64,
            username: `SFTP/${nameInput.value}`,
            password: passInput.value,
            homedir: dirInput.value
        }
        console.log(payload);

        $('*').css('cursor', 'wait')
        $('.modal button').prop('disabled', true);
        const contentType = 'application/json';

        $.ajax({
            url: '/sftpmgr/update',
            method: 'POST',
            contentType: contentType,
            data: JSON.stringify(payload)
        }).done((data) => {
            notifications.addCard('SFTP User Updated', data.Name, 'Info');
            sdAdmin.sftpUserMgr.modalCleanup(event);
            sdAdmin.sftpUserMgr.listSftpUsers(false);
        }).fail((data) => {
            notifications.addCard('Something Went Wrong', 'Error updating SFTP user', 'error');
        }).always(() => {
            $('*').css('cursor', '')
            $('.modal button').prop('disabled', false);
        });
    }
}


sdAdmin.sftpUserMgr.randPass = function(event) {
    // $('*').css('cursor','wait')
    // $('button#sftpUserRefreshBtn').prop('disabled', true);
    const contentType = 'application/json';
    $.ajax({
        url:'/sftpmgr/randpass',
        method:'GET',
        contentType:contentType,
    }).done((data) => {
        $(event.target).siblings('input').val(data.password);
    }).always(() => {
        // $('*').css('cursor','')
        // $('button#sftpUserRefreshBtn').prop('disabled', false);
    });
}

sdAdmin.sftpUserMgr.togglePassVis = function(event) {
    const target = $(event.target).siblings('input');
    if (target.prop('type') == 'password') {
        target.prop('type','text')
    } else {
        target.prop('type','password')
    }
}



sdAdmin.sftpUserMgr.listDeletedSftpUsers = function(notify) {
    $('*').css('cursor','wait')
    // $('button#sftpUserRefreshBtn').prop('disabled', true);
    const contentType = 'application/json';
    $.ajax({
        url:'/sftpmgr/listdeleted',
        method:'GET',
        contentType:contentType,
    }).done((data) => {
        sc.tempdata = data;
        console.log(data);

        if (notify) {
            notifications.addCard('SFTP Deleted User List Refreshed','','Info');
        }
    }).always(() => {
        $('*').css('cursor','')
        // $('button#sftpUserRefreshBtn').prop('disabled', false);
    });
};


sdAdmin.sftpUserMgr.deleteUser = function(event,ARN) {
    $('*').css('cursor','wait')
    // $('button#firewallCommitBtn').prop('disabled', true);
    const ARN_b64 = btoa(ARN) || event.target.closest('tr').id;
    const contentType = 'application/json';

    const payload = {"ARN_b64":ARN_b64};

    $.ajax({
        url:'/sftpmgr/delete',
        method:'POST',
        contentType:contentType,
        data:JSON.stringify(payload)
    }).done((data) => {
        console.log(data)
        notifications.addCard('User was deleted','','Info');
    }).always(() => {
        $('*').css('cursor','')
        // $('button#firewallCommitBtn').prop('disabled', false);
    });
}

sdAdmin.sftpUserMgr.unDeleteUser = function(event,ARN) {
    $('*').css('cursor','wait')
    // $('button#firewallCommitBtn').prop('disabled', true);
    const ARN_b64 = btoa(ARN) || event.target.closest('tr').id;
    const contentType = 'application/json';

    const payload = {"ARN_b64":ARN_b64};

    $.ajax({
        url:'/sftpmgr/undelete',
        method:'POST',
        contentType:contentType,
        data:JSON.stringify(payload)
    }).done((data) => {
        console.log(data)
        notifications.addCard('User was restored','','Info');
    }).always(() => {
        $('*').css('cursor','')
        // $('button#firewallCommitBtn').prop('disabled', false);
    });
}