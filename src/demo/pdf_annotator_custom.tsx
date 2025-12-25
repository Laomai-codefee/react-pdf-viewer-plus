import React from 'react';
import { PdfAnnotator } from '../features/annotator';

const PdfAnnotatorCustom: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf';

    return (
        <div>
            <PdfAnnotator
                theme="violet"
                enableRange={false}
                title={<strong>PDF ANNOTATOR FULL</strong>}
                url={pdfUrl}
                isSidebarCollapsed={false}
                user={{
                    id: '9527',
                    name: 'Lao Mai'
                }}
                enableNativeAnnotations={false}
                initialAnnotations={[{
                    "id": "BzGHwy94HKi2Okm7ViT4a",
                    "pageNumber": 1,
                    "konvaString": "{\"attrs\":{\"name\":\"PdfjsExtension_Annotator_shape_group\",\"id\":\"BzGHwy94HKi2Okm7ViT4a\",\"draggable\":true,\"x\":-749.6292037573313,\"y\":-6.835132673383586,\"scaleX\":3.943030872970916,\"scaleY\":0.6223174668345937},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":217.80000000000004,\"y\":38.400000000000006,\"width\":101.4,\"height\":71.4,\"strokeScaleEnabled\":false,\"stroke\":\"#da3324\"},\"className\":\"Rect\"}]}",
                    "konvaClientRect": {
                        "x": 105.21988950276341,
                        "y": 16.43954058623022,
                        "width": 407.7093922651926,
                        "height": 45.678102065659175
                    },
                    "title": "codefee",
                    "type": 5,
                    "pdfjsType": 5,
                    "subtype": "Square",
                    "color": "#da3324",
                    "date": "D:20251208201803+08'00'",
                    "contentsObj": {
                        "text": ""
                    },
                    "comments": [
                        {
                            "id": "yC7Jee40rC8KbgcphjwCN",
                            "title": "Lao Mai",
                            "date": "D:20251217153543+08'00'",
                            "content": "Reply"
                        }
                    ],
                    "user": {
                        "id": "9528",
                        "name": "codefee"
                    },
                    "native": false
                },
                {
                    "id": "gedFIhaYNtvG-AYkIXGsi",
                    "pageNumber": 1,
                    "konvaString": "{\"attrs\":{\"name\":\"PdfjsExtension_Annotator_shape_group\",\"id\":\"gedFIhaYNtvG-AYkIXGsi\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":152.24382863756043,\"y\":136.03052486187843,\"width\":23.160438562888466,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":175.3899861878453,\"y\":135.39654696132595,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":180.10255524861878,\"y\":135.03729281767954,\"width\":4.828798342541436,\"height\":10.81988950276243,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":187.20310773480662,\"y\":136.03052486187843,\"width\":65.43822068693888,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":252.6296270718232,\"y\":135.39654696132595,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":257.4055939226519,\"y\":136.03052486187843,\"width\":61.29435374223066,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":318.6584254143646,\"y\":135.39654696132595,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":323.3709944751381,\"y\":136.03052486187843,\"width\":77.3975987892783,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":400.7902624309392,\"y\":135.39654696132595,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":405.5028314917127,\"y\":136.03052486187843,\"width\":76.7917288933011,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":482.3092541436464,\"y\":135.39654696132595,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":487.0218232044199,\"y\":136.03052486187843,\"width\":2.8951657458563536,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":93.51174033149171,\"y\":149.01650552486188,\"width\":114.15028001985496,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":207.71229281767955,\"y\":147.94930939226518,\"width\":4.78653314917127,\"height\":10.81988950276243,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":212.42486187845302,\"y\":149.01650552486188,\"width\":65.33016377654523,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":277.7245856353591,\"y\":148.38252762430938,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":282.48998618784526,\"y\":149.01650552486188,\"width\":73.34451533364985,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":355.80953038674033,\"y\":148.38252762430938,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":360.52209944751377,\"y\":149.01650552486188,\"width\":67.7153611662638,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":428.27320441988945,\"y\":148.38252762430938,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":432.98577348066294,\"y\":149.01650552486188,\"width\":76.10962480576657,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":509.115953038674,\"y\":148.38252762430938,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":513.8285220994475,\"y\":149.01650552486188,\"width\":2.8951657458563536,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":68.2899861878453,\"y\":161.91795580110497,\"width\":70.91682574024516,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":139.16871546961326,\"y\":161.294544198895,\"width\":4.797099447513812,\"height\":9.467403314917126,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":143.93411602209943,\"y\":161.91795580110497,\"width\":63.02782515214951,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":206.9092541436464,\"y\":160.9352900552486,\"width\":4.78653314917127,\"height\":10.81988950276243,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":214.49585635359114,\"y\":161.91795580110497,\"width\":72.14994577650207,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":286.6531077348066,\"y\":160.9352900552486,\"width\":4.78653314917127,\"height\":10.81988950276243,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":294.1868784530387,\"y\":161.91795580110497,\"width\":83.0970848800069,\"height\":15.553591160220993,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":377.2908149171271,\"y\":160.9352900552486,\"height\":10.81988950276243,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                    "konvaClientRect": {
                        "x": 68.2899861878453,
                        "y": 135.03729281767954,
                        "width": 448.4337016574585,
                        "height": 42.43425414364643
                    },
                    "title": "Lao Mai",
                    "type": 1,
                    "pdfjsType": 9,
                    "subtype": "Highlight",
                    "color": "#b4fa56",
                    "date": "D:20251217203624+08'00'",
                    "contentsObj": {
                        "text": "s Gal∗+, Brendan Eich∗, Mike S...k Reitmaier#, Michael Bebenita"
                    },
                    "comments": [],
                    "user": {
                        "id": "9527",
                        "name": "Lao Mai"
                    },
                    "native": false
                }]}
                actions={(props) => (
                    <>
                        <button onClick={() =>props.save()}>save</button>
                        <button onClick={() =>{
                            console.log(props.getAnnotations())
                        }}>getAnnotations</button>
                        <button onClick={() => props.exportToExcel('Export Excel')}>Export Excel</button>
                        <button onClick={() => props.exportToPdf('Export pdf')}>Export PDF</button>
                    </>
                )}
                layoutStyle={{ height: '100vh' }}
                locale='en-US'
                onSave={(data) => {
                    alert(JSON.stringify(data));
                }}
                onLoad={() => {
                    console.log('🎉 PDF Loaded...')
                }}
                onAnnotationAdded={(annotation) => {
                    console.log('➕ Add', annotation)
                }}
                onAnnotationDeleted={(id) => {
                    console.log('➖ Delete', id)
                }}
                onAnnotationUpdated={(annotation) => {
                    console.log('✏️ Updated', annotation)
                }}
                onAnnotationSelected={(annotation, isClick) => {
                    console.log('👉 Selected', annotation, isClick)
                }}
            />
        </div>
    );
}
export default PdfAnnotatorCustom;
