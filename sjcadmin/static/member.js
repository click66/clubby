const btnDeleteMember = document.getElementById('btnDelete'),
      btnUpdateLicence = document.querySelector('.btnUpdateLicence'),
      mdlUpdateLicence = new bootstrap.Modal(document.getElementById('mdlUpdateLicence')),
      frmLicence = document.getElementById('frmLicence'),
      btnAddNote = document.getElementById('btnAddNote'),
      mdlNote = new bootstrap.Modal(document.getElementById('mdlNote')),
      frmNote = document.getElementById('frmNote'),
      btnAddPayment = document.getElementById('btnAddPayment'),
      mdlPayment = new bootstrap.Modal(document.getElementById('mdlPayment')),
      frmPayment = document.getElementById('frmPayment');

btnUpdateLicence.addEventListener('click', function () {
    mdlUpdateLicence.show();
});

frmLicence.addEventListener('submit', function (e) {
    e.preventDefault();
    postForm(this)('/api/members/' + this.dataset.uuid + '/licences/add').then(function (r) {
        location.reload();
    }).catch(handleError);
});

btnDeleteMember.addEventListener('click', function () {
    if (confirm("Are you sure? This will delete this member's record and all associated attendance records.")) {
        postNone(this.dataset.csrfToken)('/api/members/delete/' + this.dataset.uuid).then(function (r) {
            location.href = '/members';
        }).catch(handleError);
    }
});

btnAddNote.addEventListener('click', function () {
    mdlNote.show();
});

frmNote.addEventListener('submit', function (e) {
    e.preventDefault();
    postJson(this.dataset.csrfToken, {
        'text': new FormData(this).get('text'),
    })('/api/members/' + this.dataset.uuid + '/notes/add').then(function (r) {
        location.reload();
    }).catch(handleError);
});

btnAddPayment.addEventListener('click', function () {
    mdlPayment.show();
});

frmPayment.addEventListener('submit', function (e) {
    e.preventDefault();
    postJson(this.dataset.csrfToken, {
        'product': new FormData(this).get('product'),
    })('/api/members/' + this.dataset.uuid + '/payments/add').then(function (r) {
        location.reload();
    }).catch(handleError);
});

[...document.querySelectorAll('#tabsMember button')].forEach(function (te) {
    let tab = bootstrap.Tab.getOrCreateInstance(te),
        url = new URL(window.location);

    if ('#' + tab._element.dataset.tabkey == url.hash) {
        tab.show();
    }

    tab._element.addEventListener('shown.bs.tab', function (e) {
        url.hash = e.target.dataset.tabkey;
        history.pushState({}, document.title, url);
    })
});
