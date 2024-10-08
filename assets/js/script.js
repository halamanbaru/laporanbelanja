$(document).ready(function() {
    loadData();
    $('[name="qty"], [name="price"]').on('keypress', function(event) {
        return event.charCode >= 48 && event.charCode <= 57;
    });
});

const process = async() => {
    const name_item = $('[name="name-item"]').val().trim();

    if (!name_item) {
        Swal.fire("Nama barangnya apaan?");
        return false;
    }

    const names = name_item.split(/\n+/);
    
    if (names.length === 0 || names.some(name => name.length < 3)) {
        Swal.fire("Nama barang harus lebih dari 2 huruf.");
        return false;
    }

    const data = JSON.parse(localStorage.getItem('formData')) || [];

    names.forEach(name => {
        const form = {
            'name_item': name,
            'qty': 0,
            'price': 0
        };
        data.push(form);
    });

    localStorage.setItem('formData', JSON.stringify(data));
    loadData();
    $('[name="name-item"]').val('');
    $('#thide').removeAttr('style');
}


const get_data = async(obj) => {
    let data = localStorage.getItem('formData');
    data = data ? JSON.parse(data) : [];
    
    const total_price = obj.qty * obj.price;
    data.push({name_item: obj.name_item, qty: obj.qty, price: total_price});
    localStorage.setItem('formData', JSON.stringify(data));
    document.getElementById('form-input').reset();
}

const loadData = async() => {
    const dataSection = document.getElementById('thide');
    const tableBody = document.querySelector('#show tbody');
    tableBody.innerHTML = '';
    const data = JSON.parse(localStorage.getItem('formData')) || [];

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
            
            // Create input for qty
            const qtyCell = document.createElement('td');
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.value = item.qty;
            qtyInput.step = '0.01';
            qtyInput.min = '0';
            qtyInput.style.width = '100%';
            qtyInput.style.border = 'none';
            qtyInput.style.background = 'transparent';
            qtyInput.style.textAlign = 'center';
            qtyInput.addEventListener('input', validateNumberInput);
            qtyCell.appendChild(qtyInput);

            // Create input for price
            const priceCell = document.createElement('td');
            const priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.value = item.price;
            priceInput.step = '0.01';
            priceInput.min = '0';
            priceInput.style.width = '100%';
            priceInput.style.border = 'none';
            priceInput.style.background = 'transparent';
            priceInput.style.textAlign = 'center';
            priceInput.addEventListener('input', validateNumberInput);
            priceCell.appendChild(priceInput);

            const editCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-info';
            deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
            deleteButton.addEventListener('click', () => confirmation(index));
            editCell.appendChild(deleteButton);
            row.appendChild(numberCell);
            row.appendChild(name_itemCell);
            row.appendChild(qtyCell);
            row.appendChild(priceCell);
            row.appendChild(editCell);
            tableBody.appendChild(row);

            grandTotal += parseFloat(item.price) * parseFloat(item.qty);

            qtyInput.addEventListener('change', () => saveEdit(index, 'qty', qtyInput.value));
            priceInput.addEventListener('change', () => saveEdit(index, 'price', priceInput.value));
        });

        $('#grandTotal').html('Rp. ' + formatNumber(grandTotal));
    } else {
        dataSection.style.display = 'none';
        $('#section-information').attr('style', 'display: none');
    }
}

function validateNumberInput(event) {
    const input = event.target;
    const value = input.value;
    
    if (!/^\d*\.?\d*$/.test(value)) {
        input.value = value.replace(/[^\d.]/g, '');
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

const saveEdit = (index, field, value) => {
    const data = JSON.parse(localStorage.getItem('formData')) || [];
    const item = data[index];
    
    if (field === 'qty') {
        item.qty = parseFloat(value) || 0;
    } else if (field === 'price') {
        item.price = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    }
    
    localStorage.setItem('formData', JSON.stringify(data));
    loadData();
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
    const jam = String(waktuSekarang.getHours()).padStart(2, '0');
    const menit = String(waktuSekarang.getMinutes()).padStart(2, '0');
    const detik = String(waktuSekarang.getSeconds()).padStart(2, '0');
    const waktuString = `${jam}:${menit}:${detik}`;
    
    doc.setFontSize(10);
    doc.text(`Laporan belanja, hari: ${namaHari}, jam: ${waktuString}`, 105, 15, { align: "center" });

    const data = JSON.parse(localStorage.getItem('formData')) || [];
    if (data.length > 0) {
        let startY = 30;
        doc.setFontSize(12);
        doc.setTextColor(100);
        const headers = [['#', 'Nama', 'Harga /pcs (Qty)', 'Total Harga']];
        const tableData = [];

        const colorMap = {
            "barang satu": "#abaaa9",
            "barang dua": "#abaaa9",
        };

        const usedColors = {};
        data.forEach((item, index) => {
            const pricePerQty = parseFloat(item.price);
            let fillColor = '';
            const lowerCaseName = item.name_item.toLowerCase();
            
            if (usedColors[lowerCaseName]) {
                fillColor = usedColors[lowerCaseName];
            } else if (colorMap[lowerCaseName]) {
                fillColor = colorMap[lowerCaseName];
                usedColors[lowerCaseName] = fillColor;
            }

            tableData.push([
                index + 1,
                item.name_item.toLowerCase(),
                `Rp. ${formatNumber(pricePerQty)} /pcs (${item.qty})`,
                'Rp. ' + formatNumber(item.price * item.qty),
                fillColor
            ]);
        });

        const totalPrice = calculateTotalPrice(data);
        const tableDataWithTotal = [...tableData, ['', '', 'Total', 'Rp. ' + formatNumber(totalPrice)]];
        doc.autoTable({
            startY,
            head: headers,
            body: tableDataWithTotal,
            theme: 'grid',
            columnStyles: {
                0: { cellWidth: 10, halign: 'right' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 'auto', halign: 'right' },
                3: { cellWidth: 'auto', halign: 'right' }
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
                if (row === totalRowIndex && (col === 2 || col === 3)) {
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
    return data.reduce((total, item) => total + (parseFloat(item.price) * parseFloat(item.qty)), 0);
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