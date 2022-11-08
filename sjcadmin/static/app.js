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
            fetch('/api/members/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(frmNewMember)).toString(),
            }).then(function (r) {
                r.json().then(function (d) {
                    if (d.hasOwnProperty('error')) {
                        alert(d.error);
                        return
                    }

                    frmNewMember.reset();
                    table.ajax.reload();
                });
                popNewMember.hide();
            });

            e.preventDefault();
        }
    });
}
