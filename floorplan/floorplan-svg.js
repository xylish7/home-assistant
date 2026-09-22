/**
 * Apartment Floorplan SVG Layout
 */
export const floorplanSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1042 610" width="100%" height="100%">
          <defs>
            <marker id="arr-left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 8 1.5 L 2 5 L 8 8.5" fill="none" stroke="#e0af68" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </marker>
          </defs>

          <!-- Dark Canvas Background -->
          <rect width="1042" height="610" fill="#111111" />

          <!-- ==================== WALLS ==================== -->
          <g id="walls">
            <path class="wall-thick" d="
              M 24 340 L 24 26 L 122 26 L 122 44
              M 38 328 L 38 38 L 108 38 L 108 44
              M 24 340 L 48 340 L 48 582 L 716 582 L 716 512 L 1010 512 L 1010 44 L 122 44
            " />
            <path class="wall-thick" d="M 136 72 L 322 72 M 442 72 L 568 72 M 654 72 L 792 72 M 906 72 L 988 72" />
            <path class="wall-thick" d="M 64 562 L 64 512 M 64 408 L 64 346" />
            <path class="wall-thick" d="M 64 562 L 704 562 L 704 522" />
            <path class="wall-thick" d="M 988 72 L 988 496 L 824 496" />
            <path class="wall-thick" d="M 108 44 L 136 44 L 136 172 M 136 256 L 136 346 L 108 346 L 108 328 M 108 172 L 108 256" />
            <path class="wall-thin" d="M 108 172 L 136 172 M 108 256 L 136 256" />
            <path class="wall-thick" d="M 136 332 L 415 332 M 475 332 L 524 332 M 136 346 L 377 346 M 377 346 L 415 346 M 475 346 L 524 346" />
            <path class="wall-thin" d="M 415 332 L 415 346 M 475 332 L 475 346" />
            <path class="wall-thick" d="M 536 332 L 590 332 M 645 332 L 672 332 M 536 346 L 590 346 M 645 346 L 704 346" />
            <path class="wall-thin" d="M 590 332 L 590 346 M 645 332 L 645 346" />
            <path class="wall-thick" d="M 524 72 L 524 332 M 536 72 L 536 332" />
            <path class="wall-thick" d="M 704 72 L 704 346 M 720 72 L 720 376 M 720 434 L 720 496 L 704 496 L 704 346" />
            <path class="wall-thin" d="M 704 376 L 720 376 M 704 434 L 720 434" />
            <path class="wall-thick" d="M 377 416 L 377 562 M 391 436 L 391 562" />
            <path class="wall-thin" d="M 377 346 L 377 356 M 377 416 L 391 416" />
            <path class="wall-thick" d="M 391 436 L 455 436 M 510 436 L 576 436 M 391 422 L 590 422 L 590 562 M 576 436 L 576 562" />
            <path class="wall-thin" d="M 455 422 L 455 436 M 510 422 L 510 436" />
            <path class="wall-thick" d="M 812 340 L 988 340 M 824 354 L 988 354" />
            <path class="wall-thick" d="M 812 340 L 812 496 M 824 354 L 824 380 M 824 438 L 824 496" />
            <path class="wall-thin" d="M 812 380 L 824 380 M 812 438 L 824 438" />
            <path class="wall-thick" d="M 720 496 L 812 496" />
          </g>

          <!-- ==================== WINDOWS ==================== -->
          <g id="windows">
            <line class="wall-thin" x1="322" y1="44" x2="322" y2="72" />
            <line class="wall-thin" x1="442" y1="44" x2="442" y2="72" />
            <line class="window-glass" x1="322" y1="54" x2="442" y2="54" />
            <line class="window-glass" x1="322" y1="62" x2="442" y2="62" />
            <line class="window-glass" x1="382" y1="44" x2="382" y2="72" />

            <line class="wall-thin" x1="568" y1="44" x2="568" y2="72" />
            <line class="wall-thin" x1="654" y1="44" x2="654" y2="72" />
            <line class="window-glass" x1="568" y1="54" x2="654" y2="54" />
            <line class="window-glass" x1="568" y1="62" x2="654" y2="62" />
            <line class="window-glass" x1="611" y1="44" x2="611" y2="72" />

            <line class="wall-thin" x1="792" y1="44" x2="792" y2="72" />
            <line class="wall-thin" x1="906" y1="44" x2="906" y2="72" />
            <line class="window-glass" x1="792" y1="54" x2="906" y2="54" />
            <line class="window-glass" x1="792" y1="62" x2="906" y2="62" />
            <line class="window-glass" x1="849" y1="44" x2="849" y2="72" />

            <line class="wall-thin" x1="48" y1="408" x2="64" y2="408" />
            <line class="wall-thin" x1="48" y1="512" x2="64" y2="512" />
            <line class="window-glass" x1="53" y1="408" x2="53" y2="512" />
            <line class="window-glass" x1="59" y1="408" x2="59" y2="512" />
            <line class="window-glass" x1="48" y1="460" x2="64" y2="460" />
          </g>

          <!-- ==================== DOORS ==================== -->
          <g id="doors">
            <line class="door-leaf" x1="136" y1="172" x2="168" y2="198" />
            <path class="door-arc" d="M 136 214 A 42 42 0 0 0 168 198" />
            <line class="door-leaf" x1="136" y1="256" x2="168" y2="230" />
            <path class="door-arc" d="M 136 214 A 42 42 0 0 1 168 230" />

            <line class="door-leaf" x1="475" y1="332" x2="475" y2="272" />
            <path class="door-arc" d="M 415 332 A 60 60 0 0 1 475 272" />

            <line class="door-leaf" x1="590" y1="332" x2="590" y2="277" />
            <path class="door-arc" d="M 645 332 A 55 55 0 0 0 590 277" />

            <line class="door-leaf" x1="377" y1="356" x2="317" y2="356" />
            <path class="door-arc" d="M 377 416 A 60 60 0 0 1 317 356" />

            <line class="door-leaf" x1="455" y1="436" x2="455" y2="491" />
            <path class="door-arc" d="M 510 436 A 55 55 0 0 1 455 491" />

            <line class="door-leaf" x1="720" y1="434" x2="778" y2="434" />
            <path class="door-arc" d="M 720 376 A 58 58 0 0 1 778 434" />

            <line class="door-leaf" x1="824" y1="438" x2="882" y2="438" />
            <path class="door-arc" d="M 824 380 A 58 58 0 0 1 882 438" />
          </g>

          <!-- ==================== FIXTURES ==================== -->
          <g id="fixtures">
            <rect class="fixture" x="652" y="314" width="20" height="18" />
            <rect class="fixture" x="460" y="546" width="56" height="16" />
            <rect class="fixture" x="860" y="480" width="54" height="16" />
          </g>

          <!-- ==================== ENTRANCE ==================== -->
          <g id="entrance">
            <line class="arrow" x1="752" y1="542" x2="724" y2="542" marker-end="url(#arr-left)" />
          </g>

          <!-- ==================== ROOM BADGES ==================== -->
          <g id="room-labels">
            <g class="room-group" id="group-25" data-room="25">
              <circle class="room-badge" id="badge-25" cx="72" cy="118" r="22" />
              <text class="room-label" x="72" y="119">25</text>
            </g>
            <g class="room-group" id="group-18" data-room="18">
              <circle class="room-badge" id="badge-18" cx="342" cy="195" r="22" />
              <text class="room-label" x="342" y="196">18</text>
            </g>
            <g class="room-group" id="group-21" data-room="21">
              <circle class="room-badge" id="badge-21" cx="606" cy="172" r="22" />
              <text class="room-label" x="606" y="173">21</text>
            </g>
            <g class="room-group" id="group-20" data-room="20">
              <circle class="room-badge" id="badge-20" cx="842" cy="204" r="22" />
              <text class="room-label" x="842" y="205">20</text>
            </g>
            <g class="room-group" id="group-19" data-room="19">
              <circle class="room-badge" id="badge-19" cx="224" cy="454" r="22" />
              <text class="room-label" x="224" y="455">19</text>
            </g>
            <g class="room-group" id="group-22" data-room="22">
              <circle class="room-badge" id="badge-22" cx="528" cy="496" r="22" />
              <text class="room-label" x="528" y="497">22</text>
            </g>
            <g class="room-group" id="group-23" data-room="23">
              <circle class="room-badge" id="badge-23" cx="904" cy="428" r="22" />
              <text class="room-label" x="904" y="429">23</text>
            </g>
            <g class="room-group" id="group-24" data-room="24">
              <circle class="room-badge" id="badge-24" cx="652" cy="414" r="22" />
              <text class="room-label" x="652" y="415">24</text>
            </g>
          </g>

          <!-- ==================== DIMENSIONS ==================== -->
          <g id="dimensions">
            <line class="dim-line" x1="30" y1="38" x2="30" y2="328" /><line class="dim-tick" x1="26" y1="38" x2="34" y2="38" /><line class="dim-tick" x1="26" y1="328" x2="34" y2="328" /><text class="dim-text" x="30" y="185" transform="rotate(-90 30 185)" dy="-8">405</text>
            <line class="dim-line" x1="96" y1="38" x2="96" y2="328" /><line class="dim-tick" x1="92" y1="38" x2="100" y2="38" /><line class="dim-tick" x1="92" y1="328" x2="100" y2="328" /><text class="dim-text" x="96" y="185" transform="rotate(-90 96 185)" dy="-8">390</text>
            <line class="dim-line" x1="38" y1="305" x2="108" y2="305" /><line class="dim-tick" x1="38" y1="301" x2="38" y2="309" /><line class="dim-tick" x1="108" y1="301" x2="108" y2="309" /><text class="dim-text" x="73" y="300">120</text>
            <line class="dim-line" x1="136" y1="96" x2="524" y2="96" /><line class="dim-tick" x1="136" y1="92" x2="136" y2="100" /><line class="dim-tick" x1="524" y1="92" x2="524" y2="100" /><text class="dim-text" x="330" y="90">510</text>
            <line class="dim-line" x1="205" y1="72" x2="205" y2="332" /><line class="dim-tick" x1="201" y1="72" x2="209" y2="72" /><line class="dim-tick" x1="201" y1="332" x2="209" y2="332" /><text class="dim-text" x="205" y="202" transform="rotate(-90 205 202)" dy="-8">355</text>
            <line class="dim-line" x1="536" y1="255" x2="704" y2="255" /><line class="dim-tick" x1="536" y1="251" x2="536" y2="259" /><line class="dim-tick" x1="704" y1="251" x2="704" y2="259" /><text class="dim-text" x="620" y="249">220</text>
            <line class="dim-line" x1="680" y1="72" x2="680" y2="332" /><line class="dim-tick" x1="676" y1="72" x2="684" y2="72" /><line class="dim-tick" x1="676" y1="332" x2="684" y2="332" /><text class="dim-text" x="680" y="202" transform="rotate(-90 680 202)" dy="-8">355</text>
            <line class="dim-line" x1="720" y1="138" x2="988" y2="138" /><line class="dim-tick" x1="720" y1="134" x2="720" y2="142" /><line class="dim-tick" x1="988" y1="134" x2="988" y2="142" /><text class="dim-text" x="854" y="132">355</text>
            <line class="dim-line" x1="964" y1="72" x2="964" y2="340" /><line class="dim-tick" x1="960" y1="72" x2="968" y2="72" /><line class="dim-tick" x1="960" y1="340" x2="968" y2="340" /><text class="dim-text" x="964" y="206" transform="rotate(-90 964 206)" dy="-8">355</text>
            <line class="dim-line" x1="720" y1="300" x2="812" y2="300" /><line class="dim-tick" x1="720" y1="296" x2="720" y2="304" /><line class="dim-tick" x1="812" y1="296" x2="812" y2="304" /><text class="dim-text" x="766" y="294">120</text>
            <line class="dim-line" x1="812" y1="300" x2="988" y2="300" /><line class="dim-tick" x1="812" y1="296" x2="812" y2="304" /><line class="dim-tick" x1="988" y1="296" x2="988" y2="304" /><text class="dim-text" x="900" y="294">235</text>
            <line class="dim-line" x1="64" y1="540" x2="377" y2="540" /><line class="dim-tick" x1="64" y1="536" x2="64" y2="544" /><line class="dim-tick" x1="377" y1="536" x2="377" y2="544" /><text class="dim-text" x="220" y="534">415</text>
            <line class="dim-line" x1="332" y1="346" x2="332" y2="562" /><line class="dim-tick" x1="328" y1="346" x2="336" y2="346" /><line class="dim-tick" x1="328" y1="562" x2="336" y2="562" /><text class="dim-text" x="332" y="454" transform="rotate(-90 332 454)" dy="-8">320</text>
            <line class="dim-line" x1="377" y1="362" x2="704" y2="362" /><line class="dim-tick" x1="377" y1="358" x2="377" y2="366" /><line class="dim-tick" x1="704" y1="358" x2="704" y2="366" /><text class="dim-text" x="540" y="356">415</text>
            <line class="dim-line" x1="425" y1="346" x2="425" y2="422" /><line class="dim-tick" x1="421" y1="346" x2="429" y2="346" /><line class="dim-tick" x1="421" y1="422" x2="429" y2="422" /><text class="dim-text" x="425" y="384" transform="rotate(-90 425 384)" dy="-8">120</text>
            <line class="dim-line" x1="391" y1="400" x2="576" y2="400" /><line class="dim-tick" x1="391" y1="396" x2="391" y2="404" /><line class="dim-tick" x1="576" y1="396" x2="576" y2="404" /><text class="dim-text" x="483" y="394">265</text>
            <line class="dim-line" x1="590" y1="544" x2="704" y2="544" /><line class="dim-tick" x1="590" y1="540" x2="590" y2="548" /><line class="dim-tick" x1="704" y1="540" x2="704" y2="548" /><text class="dim-text" x="647" y="538">150</text>
            <line class="dim-line" x1="680" y1="346" x2="680" y2="562" /><line class="dim-tick" x1="676" y1="346" x2="684" y2="346" /><line class="dim-tick" x1="676" y1="562" x2="684" y2="562" /><text class="dim-text" x="680" y="454" transform="rotate(-90 680 454)" dy="-8">320</text>
            <line class="dim-line" x1="408" y1="436" x2="408" y2="562" /><line class="dim-tick" x1="404" y1="436" x2="412" y2="436" /><line class="dim-tick" x1="404" y1="562" x2="412" y2="562" /><text class="dim-text" x="408" y="499" transform="rotate(-90 408 499)" dy="-8">185</text>
            <line class="dim-line" x1="391" y1="532" x2="576" y2="532" /><line class="dim-tick" x1="391" y1="528" x2="391" y2="536" /><line class="dim-tick" x1="576" y1="528" x2="576" y2="536" /><text class="dim-text" x="483" y="526">250</text>
            <line class="dim-line" x1="600" y1="422" x2="600" y2="562" /><line class="dim-tick" x1="596" y1="422" x2="604" y2="422" /><line class="dim-tick" x1="596" y1="562" x2="604" y2="562" /><text class="dim-text" x="600" y="492" transform="rotate(-90 600 492)" dy="-8">200</text>
            <line class="dim-line" x1="720" y1="472" x2="812" y2="472" /><line class="dim-tick" x1="720" y1="468" x2="720" y2="476" /><line class="dim-tick" x1="812" y1="468" x2="812" y2="476" /><text class="dim-text" x="766" y="466">120</text>
            <line class="dim-line" x1="800" y1="340" x2="800" y2="496" /><line class="dim-tick" x1="796" y1="340" x2="804" y2="340" /><line class="dim-tick" x1="796" y1="496" x2="804" y2="496" /><text class="dim-text" x="800" y="418" transform="rotate(-90 800 418)" dy="-8">210</text>
            <line class="dim-line" x1="824" y1="368" x2="988" y2="368" /><line class="dim-tick" x1="824" y1="364" x2="824" y2="372" /><line class="dim-tick" x1="988" y1="364" x2="988" y2="372" /><text class="dim-text" x="906" y="362">220</text>
            <line class="dim-line" x1="970" y1="354" x2="970" y2="496" /><line class="dim-tick" x1="966" y1="354" x2="974" y2="354" /><line class="dim-tick" x1="966" y1="496" x2="974" y2="496" /><text class="dim-text" x="970" y="425" transform="rotate(-90 970 425)" dy="-8">195</text>
          </g>
        </svg>
`;
