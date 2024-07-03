$(document).ready(function() {
    loadData();
    $('[name="qty"], [name="price"]').on('keypress', function(event) {
        return event.charCode >= 48 && event.charCode <= 57;
    });
});

const process = async() => {
    const name_item = $('[name="name-item"]').val();
    const qty = $('[name="qty"]').val();
    const price = $('[name="price"]').val();
    if (name_item == '') {
        Swal.fire("nama barangnya apaan ?");
        return false;
    }
    
    if (name_item.length < 3) {
        Swal.fire("masa nama barangnya cuma " + name_item.length + " huruf sih ?");
        return false;
    }

    if (qty == '') {
        Swal.fire("quantity juga diisi ya");
        return false;
    }

    if (price == '') {
        Swal.fire("sama harga juga harus diisi nih");
        return false;
    }

    const form = {
        'name_item': name_item,
        'qty': qty,
        'price': price
    }

    get_data(form);
    loadData();
    $('#thide').removeAttr('style');
}

const get_data = async(obj) => {
    let data = localStorage.getItem('formData');
    if (data) {
        data = JSON.parse(data);
    } else {
        data = [];
    }
    
    const total_price = obj.qty * obj.price;
    data.push({name_item: obj.name_item, qty: obj.qty, price: total_price});
    localStorage.setItem('formData', JSON.stringify(data));
    document.getElementById('form-input').reset();
}

const loadData = async() => {
    const dataSection   = document.getElementById('thide');
    const tableBody     = document.querySelector('#show tbody');
    tableBody.innerHTML = '';
    const data          = JSON.parse(localStorage.getItem('formData')) || [];

    if (data.length > 0) {
        dataSection.style.display = 'block';
        $('#section-information').attr('style', 'display: block');
        let grandTotal = 0;
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            const numberCell = document.createElement('td');
            numberCell.textContent = index + 1;
            const name_itemCell = document.createElement('td');
            name_itemCell.textContent = item.name_item;
            const qtyCell = document.createElement('td');
            qtyCell.textContent = item.qty;
            const priceCell = document.createElement('td');
            priceCell.textContent = formatNumber(item.price);
            const deleteCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-info';
            deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
            deleteButton.addEventListener('click', () => confirmation(index));
            deleteCell.appendChild(deleteButton);
            row.appendChild(numberCell);
            row.appendChild(name_itemCell);
            row.appendChild(qtyCell);
            row.appendChild(priceCell);
            row.appendChild(deleteCell);
            tableBody.appendChild(row);

            grandTotal += parseFloat(item.price);
        });

        $('#grandTotal').html('Rp. ' + formatNumber(grandTotal));
    } else {
        dataSection.style.display = 'none';
        $('#section-information').attr('style', 'display: none');
    }

}

const confirmation = async(id) => {
    Swal.fire({
        title: "",
        text: "hapus nih ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText: "ga jadi",
        confirmButtonText: "iya hapus"
    }).then((result) => {
        if (result.isConfirmed) {
            deleteData(id);
            Swal.fire({
                title: "",
                text: "udah dihapus ya",
                icon: "success"
            });
        }
    });
}

const deleteData = async(index) => {
    let data = JSON.parse(localStorage.getItem('formData')) || [];
    data.splice(index, 1);
    localStorage.setItem('formData', JSON.stringify(data));
    loadData();
}

const formatNumber = (number) => {
    return parseFloat(number).toLocaleString('id-ID', { style: 'decimal', minimumFractionDigits: 0 });
}

const lihat = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    const hariIni = new Date();
    const namaHari = getNamaHari(hariIni.getDay());

    const waktuSekarang = new Date();
    const jam = waktuSekarang.getHours();
    const menit = waktuSekarang.getMinutes();
    const detik = waktuSekarang.getSeconds();
    const waktuString = `${jam}:${menit}:${detik}`;
    doc.setFontSize(10);
    doc.text(`Laporan belanja, hari: ${namaHari}, jam: ${waktuString}`, 105, 15, { align: "center" });
    const data = JSON.parse(localStorage.getItem('formData')) || [];
    if (data.length > 0) {
        let startY = 30;
        doc.setFontSize(12);
        doc.setTextColor(100);
        const headers = [['#', 'nama', 'qty', 'harga /pcs', 'total harganya']];
        const tableData = [];

        const colorMap = {
            "barang satu": "#abaaa9",
            "barang dua": "#abaaa9",
        };

        const usedColors = {};
        data.forEach((item, index) => {
            const pricePerQty = parseFloat(item.price) / item.qty;
            let fillColor = '';
            const lowerCaseName = item.name_item.toLowerCase();
            
            if (usedColors[lowerCaseName]) {
                fillColor = usedColors[lowerCaseName];
            } else if (colorMap[lowerCaseName]) {
                fillColor = colorMap[lowerCaseName];
                usedColors[lowerCaseName] = fillColor;
            }
            // else {
            //     fillColor = generateRandomColor();
            //     usedColors[lowerCaseName] = fillColor;
            // }

            tableData.push([
                index + 1,
                item.name_item.toLowerCase(),
                item.qty,
                'Rp. ' + formatNumber(pricePerQty),
                'Rp. ' + formatNumber(item.price),
                fillColor
            ]);
            if (item.qty > 1) {
                for (let i = 1; i < item.qty; i++) {
                    tableData.push(['', item.name_item, '-', 'Rp. ' + formatNumber(pricePerQty), '-', fillColor]);
                }
            }
        });

        const totalPrice = calculateTotalPrice(data);
        const tableDataWithTotal = [...tableData, ['', '', '', 'Total', 'Rp. ' + formatNumber(totalPrice)]];
        doc.autoTable({
            startY,
            head: headers,
            body: tableDataWithTotal,
            theme: 'grid',
            columnStyles: {
                0: { cellWidth: 10, halign: 'right' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 'auto', halign: 'right' },
                3: { cellWidth: 'auto', halign: 'right' },
                4: { cellWidth: 'auto', halign: 'right' },
                5: { cellWidth: 'auto', halign: 'left' }
            },
            didDrawPage: function(data) {
                const { height } = doc.internal.pageSize;
                doc.setLineWidth(0.1);
                doc.line(10, height - 20, 200, height - 20);
            },
            didParseCell: function(data) {
                const row = data.row.index;
                const col = data.column.index;
                const cellValue = data.cell.raw;

                if (col === 1 && row > 0) {
                    if (usedColors[cellValue]) {
                        data.cell.styles.fillColor = usedColors[cellValue];
                    }
                }

                const totalRowIndex = tableDataWithTotal.length - 1;
                if (row === totalRowIndex && (col === 3 || col === 4)) {
                    data.cell.styles.fillColor = '#d3d3d3';
                }
            }
        });

        doc.save(`laporan_${date}.pdf`);
    } else {
        const startX = 10;
        let startY = 30;
        doc.setFontSize(12);
        doc.text("Daftar belanja ga ada", 105, startY, { align: "center" });
        doc.save(`laporan_${date}.pdf`);
    }
}

const calculateTotalPrice = (data) => {
    return data.reduce((total, item) => total + parseFloat(item.price), 0);
}

const formatNumbered = (number) => {
    return parseFloat(number).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

const getNamaHari = (day) => {
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return namaHari[day];
}

const generateRandomColor = () => {
    // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    const randomColor = 'a8a7a7';
    return `#${randomColor}`;
}

const getTanggalSekarang = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}