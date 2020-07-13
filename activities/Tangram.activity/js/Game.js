var Game = {
  props: ['strokeColor', 'fillColor', 'isTargetAcheived', 'puzzles', 'pNo'],
  template: `
    <div id="game-screen"
      v-bind:style="{backgroundColor: strokeColor}"
    >
      <div class="game-main">
        <v-stage ref="stage" v-bind:config="configKonva" v-bind:style="{backgroundColor: '#ffffff'}"
        >
          <v-layer ref="layer" :config="configLayer">
          <template v-if="puzzles[pNo]">
            <v-line v-for="(targetTan,index) in puzzles[pNo].targetTans" :key="index" :config="targetTan"></v-line>
          </template>
          <v-line v-for="(tan,index) in tans" :key="index" :config="tan"
            v-on:tap="onTap($event, index)"
            v-on:click="onClick($event, index)"
            v-on:dragstart="onDragStart($event, index)"
            v-on:dragend="onDragEnd($event, index)"
            v-on:dragmove="onDragMove($event, index)"
            v-on:mouseover="onMouseOver($event, index)"
            v-on:mouseout="onMouseOut($event, index)"
          ></v-line>
          <v-line :config="partitionLine"></v-line>
          </v-layer>
        </v-stage>
        <div id="floating-info-block"
          v-bind:style="{width: infoContainer.width + 'px',
            height: infoContainer.height + 'px',
            top: infoContainer.top + 'px',
            right: infoContainer.right + 'px'
          }"
        >
          <div class="detail-block"
            v-bind:style="{borderColor: strokeColor}"
          >
            <div class="detail-block-logo clock-logo"></div>
            <div class="detail-block-content">
              <div>00:00</div>
            </div>
          </div>

          <div class="detail-block score-block"
            v-bind:style="{borderColor: strokeColor}"
          >
            <div class="detail-block-content score-title"><div>Score:</div></div>
            <div class="detail-block-content score-val"><div>0</div></div>
          </div>

        </div>
        <div class="tangram-name detail-block floating-block"
          v-bind:style="{width: nameBlock.width + 'px',
            height: nameBlock.height + 'px',
            top: nameBlock.top + 'px',
            left: infoContainer.left + 'px',
            borderColor: 'transparent'
          }"
        >
          <div class="detail-block-content tangram-name"><div>{{ puzzles[pNo] ? puzzles[pNo].name : ''}}</div></div>
        </div>
      </div>
      <div class="game-footer">
        <div>
        </div>
        <div class="footer-actions">
          <button
            class="btn-in-footer btn-replay"
            v-bind:style="{backgroundColor: fillColor}"
            v-on:click="onRefresh"
          ></button>
          <button
            class="btn-in-footer btn-restart"
            v-bind:style="{backgroundColor: fillColor}"
            v-on:click="$emit('restart-game')"
          ></button>
          <transition name="fade" mode="out-in">
            <button
              class="btn-in-footer btn-validate"
              v-bind:style="{backgroundColor: fillColor}"
              v-on:click="$emit('validate-question')"
              v-if="isTargetAcheived"
            ></button>
            <button
              class="btn-in-footer btn-pass"
              v-bind:style="{backgroundColor: fillColor}"
              v-on:click="$emit('pass-question')"
              v-else
            ></button>
          </transition>
        </div>
      </div>

    </div>
  `,
  data: function() {
    return {
      configKonva: {
        width: 10,
        height: 10,
      },
      configLayer: {
        scaleX: 6,
        scaleY: 6
      },
      infoContainer: {
        width: 1,
        height: 1,
        top: 0,
        right: 0,
      },
      nameBlock: {
        width: 1,
        height: 1,
        top: 0,
        left: 0
      },
      partitionLine: {
        points: [],
        stroke: 'green',
        strokeWidth: 0.8,
        lineJoin: 'round',
        dash: [2, 2]
      },
      tans: [],
      tanState: 0,
      currentTan: 0,
      flip: 5,
      translateVal: 0,
      initialPositions: [],
      selectedTanColor: '#808080',
      tanColors: ["blue","purple","red","violet","yellow","yellow"]
    }
  },

  created: function() {
    let vm = this;
    window.addEventListener('resize', vm.resize);
    window.addEventListener('keydown', vm.onKeyDown);
    window.addEventListener('keyup', vm.onKeyUp);
  },

  destroyed: function() {
    let vm = this;
    window.removeEventListener("resize", vm.resize);
    window.removeEventListener('keydown', vm.onKeyDown);
    window.removeEventListener('keyup', vm.onKeyUp);
  },

  mounted: function() {
    let vm = this;
    vm.resize();
    setTimeout(() => {
      vm.initializeTans();
    }, 0);
  },

  methods: {
    resize: function() {
      let vm = this;
      let toolbarElem = document.getElementById("main-toolbar");
      let toolbarHeight = toolbarElem.offsetHeight != 0 ? toolbarElem.offsetHeight + 3 : 3;
      let newHeight = window.innerHeight - toolbarHeight;
      let newWidth = window.innerWidth;
      let ratio = newWidth / newHeight

      document.querySelector('#game-screen').style.height = newHeight + "px";
      let gameMainEle = document.querySelector('.game-main');
      let cw = gameMainEle.offsetWidth * 0.98;
      let ch = gameMainEle.offsetHeight * 0.97;
      let scale = Math.min(cw, ch) / 80;

      let pw = vm.configKonva.width;
      let ph = vm.configKonva.height;
      let pScale = Math.min(pw, ph) / 80;
      if (pw == 10) {
        pw = 0;
        ph = 0;
      }

      vm.$set(vm.configKonva, 'width', cw);
      vm.$set(vm.configKonva, 'height', ch);

      vm.$set(vm.configLayer, 'scaleX', scale);
      vm.$set(vm.configLayer, 'scaleY', scale);

      let tangram_dx = (cw / scale - pw / pScale) / 3;
      let tangram_dy = (ch / scale - ph / pScale) / 2;

      vm.$emit('center-tangram', {
        dx: tangram_dx,
        dy: tangram_dy
      });

      for (var i = 0; i < 7; i++) {
        switch (i) {
          case 0:
            vm.initialPositions.push({
              x: (cw / scale) * 0.88,
              y: (ch / scale) * 0.75
            })
            break;
          case 1:
            vm.initialPositions.push({
              x: (cw / scale) * 0.87,
              y: (ch / scale) * 0.40
            })
            break;
          case 2:
            vm.initialPositions.push({
              x: (cw / scale) * 0.72,
              y: (ch / scale) * 0.75
            })
            break;
          case 3:
            vm.initialPositions.push({
              x: (cw / scale) * 0.93,
              y: (ch / scale) * 0.62
            })
            break;
          case 4:
            vm.initialPositions.push({
              x: (cw / scale) * 0.75,
              y: (ch / scale) * 0.52
            })
            break;
          case 5:
            vm.initialPositions.push({
              x: (cw / scale) * 0.78,
              y: (ch / scale) * 0.60
            })
            break;
          case 6:
            vm.initialPositions.push({
              x: (cw / scale) * 0.72,
              y: (ch / scale) * 0.33
            })
            break;
        }
      }

      if (vm.tans.length != 0) {
        for (var index = 0; index < 7; index++) {
          let tan_dx = ((cw / pw) * (pScale / scale) - 1) * vm.tans[index].points[0];
          let tan_dy = ((ch / ph) * (pScale / scale) - 1) * vm.tans[index].points[1];
          vm.moveTan(index, tan_dx, tan_dy);
        }
      }

      vm.$set(vm.infoContainer, 'width', gameMainEle.offsetWidth * 0.30);
      vm.$set(vm.infoContainer, 'height', gameMainEle.offsetHeight * 0.15);
      vm.$set(vm.infoContainer, 'top', toolbarHeight + gameMainEle.offsetHeight * 0.02);
      vm.$set(vm.infoContainer, 'right', gameMainEle.offsetWidth * 0.01);

      let partitionLinePoints = [gameMainEle.offsetWidth * 0.685 / scale, gameMainEle.offsetHeight * 0.16 / scale, gameMainEle.offsetWidth * 0.685 / scale, ch / scale];
      vm.$set(vm.partitionLine, 'points', partitionLinePoints);
      vm.$set(vm.partitionLine, 'stroke', vm.strokeColor);

      vm.$set(vm.nameBlock, 'width', gameMainEle.offsetWidth * 0.20);
      vm.$set(vm.nameBlock, 'height', gameMainEle.offsetHeight * 0.15);
      //vm.$set(vm.nameBlock, 'bottom', document.querySelector('.game-footer').offsetHeight * 1.1 + gameMainEle.offsetHeight * 0.01);
      vm.$set(vm.nameBlock, 'top', gameMainEle.offsetHeight * 0.01 + toolbarHeight);
      vm.$set(vm.infoContainer, 'left', gameMainEle.offsetWidth * 0.01 + cw / 4.5);

      if (vm.isTargetAcheived) {
        document.querySelector('.btn-validate').style.width = document.querySelector('.btn-validate').offsetHeight + "px";
      } else {
        document.querySelector('.btn-pass').style.width = document.querySelector('.btn-pass').offsetHeight + "px";
      }
      document.querySelector('.btn-restart').style.width = document.querySelector('.btn-restart').offsetHeight + "px";
      document.querySelector('.btn-replay').style.width = document.querySelector('.btn-replay').offsetHeight + "px";

    },

    initializeTans: function() {
      let vm = this;
      let tans = [];
      let squareTangram = standardTangrams[0].tangram;
      for (let i = 0; i < squareTangram.tans.length; i++) {
        let tan = {
          tanType: squareTangram.tans[i].tanType,
          x: 100,
          y: 100,
          offsetX: 100,
          offsetY: 100,
          orientation: 0,
          rotation: 0,
          points: [],
          pointsObjs: [],
          stroke: vm.strokeColor,
          strokeEnabled: false,
          strokeWidth: 0.8,
          closed: true,
          draggable: true,
          fill: 'blue',
          lineJoin: 'round',
        }
        let points = [...squareTangram.tans[i].getPoints()];
        let center = squareTangram.tans[i].center();
        let dx = vm.initialPositions[i].x - points[0].toFloatX();
        let dy = vm.initialPositions[i].y - points[0].toFloatY();

        let floatPoints = [];
        let pointsObjs = [];
        for (let j = 0; j < points.length; j++) {
          let tmpPoint = points[j].dup();
          tmpPoint.x.add(new IntAdjoinSqrt2(dx, 0));
          tmpPoint.y.add(new IntAdjoinSqrt2(dy, 0));
          pointsObjs.push(tmpPoint);
          floatPoints.push(tmpPoint.toFloatX());
          floatPoints.push(tmpPoint.toFloatY());
        }
        tan.offsetX = (center.toFloatX() + dx);
        tan.offsetY = (center.toFloatY() + dy);
        tan.x = tan.offsetX;
        tan.y = tan.offsetY;
        tan.orientation = squareTangram.tans[i].orientation;
        tan.points = floatPoints;
        tan.pointsObjs = pointsObjs;
        tan.fill = i === vm.currentTan ? vm.selectedTanColor : vm.tanColors[tan.tanType];
        tans.push(tan);
      }
      vm.tans = tans;

      vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
      vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
      vm.currentTan = 0;
      vm.$set(vm.tans[vm.currentTan], 'fill', vm.selectedTanColor);
      vm.tanState = 0;
    },

    snapTan: function(index) {
      let vm = this;
      let currentTan = this.tans[index];
      let x = currentTan.x;
      let y = currentTan.y;
      let currentTanPoints = currentTan.points;

      let flag = false;
      for (let i = 0; i < 7; i++) {
        if (i == index) {
          continue;
        }
        let otherTanPoints = [...vm.tans[i].points];
        let otherTanPointsObjs = [...vm.tans[i].pointsObjs];
        for (let j = 0; j < currentTanPoints.length; j += 2) {
          let fl = false;
          for (let k = 0; k < otherTanPoints.length; k += 2) {
            if (Math.abs(currentTanPoints[j] - otherTanPoints[k]) <= 1 && Math.abs(currentTanPoints[j + 1] - otherTanPoints[k + 1]) <= 1) {
              let diff = otherTanPointsObjs[k / 2].dup().subtract(vm.tans[index].pointsObjs[j / 2]);
              let dx = diff.toFloatX();
              let dy = diff.toFloatY();
              vm.moveTan(index, dx, dy, diff);
              fl = true;
              break;
            }
          }
          if (fl) {
            flag = true;
            break;
          }
        }
        if (flag) {
          break;
        }
      }

      if (!flag) {
        for (var i = 0; i < currentTanPoints.length; i += 2) {

          for (var targetTan = 0; targetTan < vm.puzzles[vm.pNo].targetTans.length; targetTan++) {
            var fl = false;
            for (var j = 0; j < vm.puzzles[vm.pNo].targetTans[targetTan].points.length; j += 2)
              if (Math.abs(currentTanPoints[i] - vm.puzzles[vm.pNo].targetTans[targetTan].points[j]) <= 1 && Math.abs(currentTanPoints[i + 1] - vm.puzzles[vm.pNo].targetTans[targetTan].points[j + 1]) <= 1) {

                var diff = vm.puzzles[vm.pNo].targetTans[targetTan].pointsObjs[j / 2].dup().subtract(vm.tans[index].pointsObjs[i / 2]);
                var dx = diff.toFloatX();
                var dy = diff.toFloatY();
                vm.moveTan(index, dx, dy, diff);
                fl = true;
                break;
              }
            if (fl) {
              flag = true;
              break;
            }
          }
          if (flag) {
            break;
          }
        }
      }

    },

    moveTan: function(index, dx, dy, diff) {
      let vm = this;
      let points = [];
      for (let i = 0; i < vm.tans[index].points.length; i += 2) {
        if (diff) {
          vm.tans[index].pointsObjs[i / 2].add(diff);
        } else {
          vm.tans[index].pointsObjs[i / 2].x.add(new IntAdjoinSqrt2(dx, 0));
          vm.tans[index].pointsObjs[i / 2].y.add(new IntAdjoinSqrt2(dy, 0));
        }
        points.push(vm.tans[index].points[i] + dx);
        points.push(vm.tans[index].points[i + 1] + dy);
      }
      vm.$set(vm.tans[index], 'offsetX', vm.tans[index].offsetX + dx);
      vm.$set(vm.tans[index], 'offsetY', vm.tans[index].offsetY + dy);
      vm.$set(vm.tans[index], 'x', vm.tans[index].x + dx);
      vm.$set(vm.tans[index], 'y', vm.tans[index].y + dy);
      vm.$set(vm.tans[index], 'points', points);
    },

    rotateTan: function(index) {
      let vm = this;
      let cx = vm.tans[index].x;
      let cy = vm.tans[index].y;
      let tanCenter = new Point(new IntAdjoinSqrt2(cx, 0), new IntAdjoinSqrt2(cy, 0));

      if (vm.tans[index].tanType == vm.flip && vm.tans[index].orientation == 3) {
        //flip parallelogram
        vm.$set(vm.tans[index], 'tanType', vm.flip == 4 ? 5 : 4);
        vm.$set(vm.tans[index], 'orientation', 0);

        let anchor = tanCenter.dup();
        let sub = InsideDirections[vm.tans[index].tanType][vm.tans[index].orientation][0];
        anchor.x.subtract(new IntAdjoinSqrt2(sub.toFloatX(), 0));
        anchor.y.subtract(new IntAdjoinSqrt2(sub.toFloatY(), 0));

        let flippedTan = new Tan(vm.tans[index].tanType, anchor, vm.tans[index].orientation);
        let points = flippedTan.getPoints();
        let center = flippedTan.center();
        vm.$set(vm.tans[index], 'points', []);
        vm.$set(vm.tans[index], 'pointsObjs', []);

        for (let j = 0; j < points.length; j++) {
          vm.tans[index].pointsObjs.push(points[j]);
          vm.tans[index].points.push(points[j].toFloatX());
          vm.tans[index].points.push(points[j].toFloatY());
        }
        vm.$set(vm.tans[index], 'offsetX', cx);
        vm.$set(vm.tans[index], 'offsetY', cy);
        vm.$set(vm.tans[index], 'x', cx);
        vm.$set(vm.tans[index], 'y', cy);

        vm.flip = vm.flip == 4 ? 5 : 4;
      } else {
        //update points of tan
        let points = [];
        for (let i = 0; i < vm.tans[index].points.length; i += 2) {
          let x1 = vm.tans[index].points[i];
          let y1 = vm.tans[index].points[i + 1];
          let pt = new Point(new IntAdjoinSqrt2(x1, 0), new IntAdjoinSqrt2(y1, 0));
          vm.tans[index].pointsObjs[i / 2].subtract(tanCenter).rotate(45).add(tanCenter);
          pt.subtract(tanCenter).rotate(45).add(tanCenter);
          points.push(pt.toFloatX());
          points.push(pt.toFloatY());
        }
        vm.$set(vm.tans[index], 'points', points);
        vm.$set(vm.tans[index], 'orientation', (vm.tans[index].orientation + 1) % 8);
      }
    },

    onClick: function(e, index) {
      let vm = this;
      if (index != vm.currentTan) {
        vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
        vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
        vm.currentTan = index;
        vm.$set(vm.tans[index], 'fill', vm.selectedTanColor);
        vm.tanState = 0;
        return;
      }
      if (vm.tanState === 1) {
        vm.rotateTan(index);
      } else {
        vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
        vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', true);
        vm.tanState = 1;
      }
    },

    onTap: function(e, index) {
      let vm = this;
      if (index != vm.currentTan) {
        vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
        vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
        vm.currentTan = index;
        vm.$set(vm.tans[index], 'fill', vm.selectedTanColor);
        vm.tanState = 0;
        return;
      }
      if (vm.tanState === 1) {
        vm.rotateTan(index);
      } else {
        vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
        vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', true);
        vm.tanState = 1;
      }
    },

    onDragStart: function(e, index) {
      let vm = this;
      if (index != vm.currentTan) {
        vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
        vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
        vm.currentTan = index;
      }
      vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
      vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', true);
      vm.tanState = 1;
    },

    onDragEnd: function(e, index) {
      let vm = this;
      let isTanOutsideCanvas = false;
      let finalX = e.target.attrs.x;
      let finalY = e.target.attrs.y;
      let boundingBox = e.target.getClientRect();

      //checking conditions if the tan gets out of canvas boundary
      let scale = vm.configLayer.scaleX;
      if (boundingBox.x < 0) {
        finalX = boundingBox.width / (2 * scale);
        isTanOutsideCanvas = true;
      }
      if (boundingBox.y < 0) {
        finalY = boundingBox.height / (2 * scale);
        isTanOutsideCanvas = true;
      }
      if (boundingBox.y + boundingBox.height > vm.configKonva.height) {
        finalY = (vm.configKonva.height - boundingBox.height / 2) / scale;
        isTanOutsideCanvas = true;
      }
      if (boundingBox.x + boundingBox.width > vm.configKonva.width - vm.infoContainer.width && boundingBox.y < vm.infoContainer.height) {
        let tmpx = (vm.configKonva.width - vm.infoContainer.width - boundingBox.width / 2) / scale;
        let tmpy = (vm.infoContainer.height + boundingBox.height / 2) / scale;
        let d1 = Math.abs(tmpx - vm.tans[index].x);
        let d2 = Math.abs(tmpy - vm.tans[index].y);
        if (d1 <= d2) {
          finalX = tmpx;
        } else {
          finalY = tmpy;
        }
        isTanOutsideCanvas = true;
      }
      if (boundingBox.x + boundingBox.width > vm.configKonva.width && boundingBox.y > vm.infoContainer.height) {
        finalX = (vm.configKonva.width - boundingBox.width / 2) / scale;
        isTanOutsideCanvas = true;
      }

      if (isTanOutsideCanvas) {
        let dx = finalX - this.tans[index].x;
        let dy = finalY - this.tans[index].y;
        setTimeout(() => {
          vm.moveTan(index, dx, dy);
        }, 0);
      }

      setTimeout(() => {
        vm.snapTan(index);
      }, 0);
      //this.checkIfSolved();
    },

    onDragMove: function(e, index) {
      let vm = this;
      let finalX = e.target.attrs.x;
      let finalY = e.target.attrs.y;
      let dx = finalX - this.tans[index].x;
      let dy = finalY - this.tans[index].y;

      setTimeout(() => {
        vm.moveTan(index, dx, dy);
      }, 0);
    },

    onMouseOver: function(e, index) {
      let vm = this;
      vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
      vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
      vm.currentTan = index;
      vm.$set(vm.tans[index], 'fill', vm.selectedTanColor);
      vm.tanState = 0;
      //vm.$set(vm.tans[index], 'strokeEnabled', true);
    },

    onMouseOut: function(e, index) {
      let vm = this;
      vm.tanState = 0;
      vm.$set(vm.tans[vm.currentTan], 'fill', vm.selectedTanColor);
      vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
      //vm.$set(vm.tans[index], 'strokeEnabled', false);
    },

    onKeyDown: function(e) {
      let vm = this;
      if (vm.tanState === 0) {
        if (e.keyCode === 37 || e.keyCode === 40) {
          vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
          let newTan = (vm.currentTan - 1) % 7;
          vm.currentTan = newTan < 0 ? newTan + 7 : newTan;
          vm.$set(vm.tans[vm.currentTan], 'fill', vm.selectedTanColor);
        } else if (e.keyCode === 38 || e.keyCode === 39) {
          vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
          vm.currentTan = (vm.currentTan + 1) % 7;
          vm.$set(vm.tans[vm.currentTan], 'fill', vm.selectedTanColor);
        } else if (e.keyCode === 13) {
          vm.tanState = 1;
          vm.$set(vm.tans[vm.currentTan], 'fill', vm.tanColors[vm.tans[vm.currentTan].tanType]);
          vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', true);
        }
      } else if (vm.tanState === 1) {
        let delta = 3;
        let scale = vm.configLayer.scaleX;
        let dx = delta / scale;
        let dy = delta / scale;

        if (e.keyCode === 37) {
          dx *= -1;
          dy = 0;
        } else if (e.keyCode === 38) {
          dx = 0;
          dy *= -1;
        } else if (e.keyCode === 39) {
          dx *= 1;
          dy = 0;
        } else if (e.keyCode === 40) {
          dx = 0;
          dy *= 1;
        } else {
          dx = 0;
          dy = 0;
        }

        if (e.keyCode === 16) {
          vm.rotateTan(vm.currentTan);
        }

        if (e.keyCode === 13) {
          vm.tanState = 0;
          vm.$set(vm.tans[vm.currentTan], 'fill', vm.selectedTanColor);
          vm.$set(vm.tans[vm.currentTan], 'strokeEnabled', false);
        }

        vm.moveTan(vm.currentTan, dx, dy);
      }
    },

    onKeyUp: function(e) {
      let vm = this;
      setTimeout(() => {
        vm.snapTan(vm.currentTan);
      }, 0);
    },

    onRefresh: function (e) {
      if (e.screenX === 0 && e.screenY === 0) {
        return;
      }
      this.initializeTans();
    },

  }
}
