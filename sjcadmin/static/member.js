const btnDeleteMember = document.getElementById('btnDelete'),
      btnUpdateLicence = document.querySelector('.btnUpdateLicence'),
      mdlUpdateLicence = new bootstrap.Modal(document.getElementById('mdlUpdateLicence')),
      frmLicence = document.getElementById('frmLicence'),
      btnAddNote = document.getElementById('btnAddNote'),
      mdlNote = new bootstrap.Modal(document.getElementById('mdlNote')),
      frmNote = document.getElementById('frmNote');

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