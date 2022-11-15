const toast = type => {
    let t = document.createElement('div'),
        tinner = document.createElement('div'),
        tbody = document.createElement('div'),
        btn = document.createElement('button');

    t.classList.add('toast', 'align-items-center');
    t.setAttribute('role', 'alert');
    t.setAttribute('aria-live', 'assertive');
    t.setAttribute('aria-atomic', 'true');
    tinner.classList.add('d-flex');
    tbody.classList.add('toast-body');
    btn.setAttribute('type', 'button');
    btn.classList.add('btn-close', 'btn-close-white', 'me-2', 'm-auto');
    btn.dataset.bsDismiss = 'toast';
    btn.setAttribute('aria-label', 'Close');

    switch (type) {
        case 'error':
            t.classList.add('text-white', 'bg-danger');
            break;
    }

    t.appendChild(tinner);
    tinner.appendChild(tbody);
    tinner.appendChild(btn);

    return function (text) {
        r = t.cloneNode(true);
        r.querySelector('.toast-body').appendChild(document.createTextNode(text));
        return r;
    }
}

function notify(toast) {
    document.getElementById('toastRack').appendChild(toast);
    bootstrap.Toast.getOrCreateInstance(toast).show();
}

const postForm = form => url => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(new FormData(form)).toString(),
}).then(function (r) {
    return r.json().then(function (d) {
        if (d.hasOwnProperty('error')) {
            return Promise.reject(new Error(d.error));
        }
        return d;
    })
});

const error = toast('error');
const handleError = text => notify(error(text));

const frmNewMember = document.getElementById('frmNewMember'),
      btnNewMember = document.getElementById('btnNewMember');

if (frmNewMember && btnNewMember) {
    const popNewMember = new bootstrap.Popover(document.getElementById('btnNewMember'), {
        container: 'body',
        html: true,
        content: frmNewMember,
        trigger: 'manual',
    });

    btnNewMember.addEventListener('click', function () {
        popNewMember.toggle();
    });

    btnNewMember.addEventListener('shown.bs.popover', function () {
        document.getElementById('mdlNewMember_studentName').focus();
    });

    frmNewMember.addEventListener('click', function (e) {
        if (event.target && event.target.id == 'mdlNewMember_submit') {
            postForm(frmNewMember)('api/members/add').then(function (r) {
                popNewMember.hide();
                frmNewMember.reset();
                table.ajax.reload();
            }).catch(handleError);

            e.preventDefault();
        }
    });
}

