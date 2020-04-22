const gridDefaultOptions = {
    grid: 'grid',
    colors: ['#1D1E22', '#FFFFFF'],
    binary: ['0', '1'],
    gridWidth: 8,
    gridHeight: 8,
    gridModule: 8,
    currentHexCode: '',
    currentBinaryCode: []
};

class PixelArtBit {
    constructor(options = []) {
        const gridOptions = {...gridDefaultOptions, ...options};

        this.grid = document.getElementById(gridOptions.grid);
        this.colors = gridOptions.colors;
        this.binary = gridOptions.binary;
        this.gridWidth = gridOptions.gridWidth;
        this.gridHeight = gridOptions.gridHeight;
        this.gridModule = gridOptions.gridModule;
        this.currentZoom = 1;
        this.zoomFactor = 0.1;
        this.clicking = false;
        this.currentCell = null;
        this.mouseMove = false;
        this.initEvents();
    }

    initEvents() {
        document.getElementById('gridSizeSelector').addEventListener('change',
          (e) => this.readGridSelectSize(e)
        );

        document.getElementById('inputDataAreaSubmit').addEventListener('click',
            () => this.loadDataIntoGrid()
        );

        document.getElementById('zoomIn').addEventListener('click',
            () => this.zoom('in')
        );

        document.getElementById('zoomOut').addEventListener('click',
            () => this.zoom('out')
        );

        const dataCodeToggleButtons = document.querySelectorAll('.show__dataCode');
        [...dataCodeToggleButtons].map(element => element.addEventListener('click', (e) => this.toggleDataCode(e)));
    }

    zoom(type) {
        this.currentZoom = (type === 'in') ?
            Math.min(1, this.currentZoom + this.zoomFactor) :
            Math.max(0.1, this.currentZoom - this.zoomFactor);

        this.grid.style.transform = `scale(${this.currentZoom})`;
    }

    toggleDataCode(e) {
        const ele = e.target;
        $(ele).parent().next().toggle();
    }

    checkHex(n) {
        return /^[0-9A-Fa-f]{1,64}$/.test(n);
    }

    Hex2Bin(n) {
        return !this.checkHex(n) ? 0 : parseInt(n, 16).toString(2);
    }

    padToEight(number) {
        return number <= 9999999 ? `0000000${number}`.slice(-8) : number;
    }

    generateGrid() {
        let row,
            cell;

        this.grid.innerHTML = '';

        for (let i = 0; i < this.gridHeight; i++) {
            row = this.grid.insertRow(i);
            for (let j = 0; j < this.gridWidth; j++) {
                cell = row.insertCell(j);
                //cell.onclick = (e) => this.clickCell(e.currentTarget);
                cell.innerText = '0';
            }
        }

        this.attachGridEvents();
        this.generateBinaryCode();

        return this;
    }

    attachGridEvents() {
        $(this.grid)
            .off()
            .on('mousedown', 'td', (e) => {
                this.clicking = true;
                this.currentCell = e.target;
                this.clickCell(this.currentCell);
                console.info( 'click ', this.currentCell );
            })
            .on('mouseup', (e) => {
                this.clicking = false;
            })
            .on('mousemove', (e) => {
                if ((this.clicking === false) || this.currentCell === e.target) {
                    return false;
                }
                this.currentCell = e.target;
                this.clickCell(this.currentCell);
            });
    }

    generateBinaryCode() {
        const totalLoops = this.gridWidth / this.gridModule,
            totalSubmodules = totalLoops,
            fullModule = this.gridModule * totalSubmodules,
            totalSubmoduleLoops = totalLoops / totalSubmodules;

        let currentSubmodule = 0;

        this.binaryCode = [];
        // console.info( `Total Loops: ${totalLoops}` );
        do {
            for (let currentLoop = 0; currentLoop < totalLoops; currentLoop++) {
                let submodulePos = currentSubmodule * fullModule;
                for (let currentCol = submodulePos; currentCol < submodulePos + fullModule; currentCol++) {
                    // console.info( `current Col: ${currentCol}, total: ${submodulePos}, ${fullModule}` );
                    let currentCelPos = ((currentLoop + 1) * this.gridModule) - 1,
                        byte = '';

                    for (let currentCell = currentCelPos; currentCell > currentCelPos - this.gridModule; currentCell--) {
                        //console.info( `currentCell: ${currentCell}, currentCol: ${currentCol}` );
                        byte += this.grid.rows[currentCell].cells[currentCol].innerText;
                    }

                    this.binaryCode.push(byte);
                }
            }

            currentSubmodule++;
        } while (currentSubmodule < totalSubmoduleLoops);

        this.printCode(this.binaryCode);
    }

    printCode(binaryCode) {
        this.currentHexCode = binaryCode.map(
            byte => '0x' + ('00' + parseInt(byte, 2).toString(16)).substr(-2)
        ).join(', ');

        binaryCode = binaryCode.join(', ');

        document.getElementById('binaryCode').innerHTML = binaryCode;
        document.getElementById('hexCode').innerHTML = this.currentHexCode;
        document.getElementById('fileSize').innerHTML = this.getTotalBytes();
    }

    getTotalBytes() {
        return (this.gridWidth * this.gridHeight) / this.gridModule;
    }

    clearGrid() {
        let color = this.colors[0],
            binaryValue = this.binary[0];

        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                let cell = this.grid.rows[i].cells[j];
                cell.style.backgroundColor = color;
                cell.innerText = binaryValue;
            }
        }

        this.generateBinaryCode();
    }

    fillGridWithDataxx(data) {
        const byte = data.join('').split('');
        let bit = 0;

        console.info( `Fill Grid with Data. Width: ${this.gridWidth}, Height: ${this.gridHeight}` );

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = this.gridHeight - 1; y >= 0; y--) {
                let cell = this.grid.rows[y].cells[x],
                    currentBit = byte[bit++];
                cell.style.backgroundColor = this.colors[currentBit];
                cell.innerText = currentBit;
            }
        }

        this.generateBinaryCode();

        return this;
    }

    fillGridWithData(data) {
        const byte = data.join('').split(''),
            totalLoops = this.gridWidth / this.gridModule,
            totalSubmodules = totalLoops,
            fullModule = this.gridModule * totalSubmodules,
            totalSubmoduleLoops = totalLoops / totalSubmodules;

        let bytes = 0, bit = 0;
        let currentSubmodule = 0;

        do {
            for (let currentLoop = 0; currentLoop < totalLoops; currentLoop++) {
                let submodulePos = currentSubmodule * fullModule;
                for (let currentCol = submodulePos; currentCol < submodulePos + fullModule; currentCol++) {
                    let currentCelPos = ((currentLoop + 1) * this.gridModule) - 1;
                    for (let currentCell = currentCelPos; currentCell > currentCelPos - this.gridModule; currentCell--) {
                        let cell = this.grid.rows[currentCell].cells[currentCol],
                            currentBit = byte[bit++];

                        // console.info( `Style -> currentCell ${currentCell} currentCol ${currentCol}` );

                        cell.style.backgroundColor = this.colors[currentBit];
                        cell.innerText = currentBit;
                    }

                    bytes++;
                }
            }

            currentSubmodule++;
        } while (currentSubmodule < totalSubmoduleLoops);

        this.generateBinaryCode();

        return this;
    }

    invertGrid() {
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                let cell = this.grid.rows[i].cells[j];
                let inverseCellValue = this.getInverseCellValue(cell);
                cell.style.backgroundColor = this.colors[inverseCellValue];
                cell.innerText = this.binary[inverseCellValue];
            }
        }

        this.generateBinaryCode();
    }

    getInverseCellValue(cell) {
        return cell.innerText === '0' ? 1 : 0;
    }

    flipGrid() {
        let data = this.reverse(this.binaryCode, this.gridWidth);
        this.fillGridWithData(data);
    }

    showBinary() {
        $(this.grid).toggleClass('binary--hide');
    }

    showGuides() {
        $(this.grid).toggleClass('guides--off');
    }

    clickCell(cell) {
        let inverseCellValue = this.getInverseCellValue(cell);
        cell.style.backgroundColor = this.colors[inverseCellValue];
        cell.innerText = this.binary[inverseCellValue];
console.info( 'inverse: ', inverseCellValue );
        this.generateBinaryCode();
    }

    readGridSelectSize(e) {
        const newGridSize = e.currentTarget.value;
        const newDataSize = newGridSize * newGridSize / this.gridModule;
        const currentData = this.resizeArr(this.binaryCode, newDataSize, "00000000");

        console.info( 'new size: ', e, newGridSize, currentData, this.gridWidth, this.gridHeight );

        this.setDataGridSize(newGridSize, newGridSize)
          .generateGrid()
          .fillGridWithData(currentData);
    }

    resizeArr(arr, newSize, defaultValue) {
        return [ ...arr, ...Array(Math.max(newSize - arr.length, 0)).fill(defaultValue)];
    }

    loadDataIntoGrid() {
        const dataHeader = document.getElementById('dataCodeHeaderCheckbox').checked;
        const rawData = document.getElementById('inputDataArea').value;
        const data = this.getNewGridData(rawData, dataHeader);
        const gridWidth = dataHeader ? this.getGridWidthFromDataHeader(rawData) : Math.sqrt(data.length * 8);
        const gridHeight = dataHeader ? this.getGridHeightFromDataHeader(rawData) : Math.sqrt(data.length * 8);

        console.info( 'Load data into grid: ', gridWidth, gridHeight );

        this.setDataGridSize(gridWidth, gridHeight)
            .generateGrid()
            .fillGridWithData(data);
    }

    getNewGridData(data, dataHeader) {
        data = this.parseGridData(data);

        if (dataHeader) {
            data = data.slice(2);
        }

        data = data.map(value => value.replace(/0x/g, ''));
        data = data.map(value => this.padToEight(this.Hex2Bin(value)));

        return data;
    }

    parseGridData(data) {
        return data.replace(/\s+/g, '').split(',').filter(Boolean);
    }

    getGridWidthFromDataHeader(data) {
        data = this.parseGridData(data);

        return data[0];
    }

    getGridHeightFromDataHeader(data) {
        data = this.parseGridData(data);

        return data[1];
    }

    setDataGridSize(gridWidth, gridHeight) {
        const gridSizeSelector = document.getElementById('gridSizeSelector');

        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        gridSizeSelector.value = gridWidth;

        return this;
    }

    reverse(arr, k) {
        const n = arr.length;

        for (let i = 0; i < n; i += k) {
            let left = i,
                right = Math.min(i + k - 1, n - 1),
                temp;

            // reverse the sub-array [left, right]
            while (left < right) {
                temp = arr[left];
                arr[left] = arr[right];
                arr[right] = temp;
                left++;
                right--;
            }
        }

        return arr;
    }
}

let pixelArtBit = new PixelArtBit();
pixelArtBit.generateGrid();
