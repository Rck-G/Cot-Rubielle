import streamlit as st
import pandas as pd
import urllib.parse
import os

# --- CONFIGURACIÓN DE PÁGINA ---
st.set_page_config(
    page_title="Cotizador de Pedidos | Artesanal Pro",
    page_icon="🌸",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- ESTILOS CSS PERSONALIZADOS ---
custom_css = """
<style>
    /* Estilos generales y fuentes */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    /* Headers personalizados */
    .main-header {
        background: linear-gradient(135deg, #FF6B8B 0%, #D83A6F 100%);
        padding: 1.8rem 2rem;
        border-radius: 16px;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 10px 25px -5px rgba(216, 58, 111, 0.3);
    }
    .main-header h1 {
        margin: 0;
        font-size: 2.2rem;
        font-weight: 700;
        color: white !important;
    }
    .main-header p {
        margin: 0.4rem 0 0 0;
        opacity: 0.9;
        font-size: 1rem;
    }

    /* Cards KPI Financieras */
    .kpi-card {
        background: var(--background-secondary-color, #f8f9fa);
        border: 1px solid rgba(128, 128, 128, 0.2);
        border-radius: 14px;
        padding: 1.2rem;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.06);
    }
    .kpi-title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #888;
        margin-bottom: 0.3rem;
    }
    .kpi-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-color, #111);
    }
    .kpi-sub {
        font-size: 0.8rem;
        color: #2e7d32;
        font-weight: 600;
        margin-top: 0.2rem;
    }

    .price-hero {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        margin-top: 1rem;
        box-shadow: 0 10px 20px rgba(56, 239, 125, 0.25);
    }
    .price-hero-title {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.9;
    }
    .price-hero-value {
        font-size: 2.5rem;
        font-weight: 800;
        margin: 0.2rem 0;
    }

    /* Botones y Tablas */
    .stButton>button {
        border-radius: 10px;
        font-weight: 600;
    }
</style>
"""
st.markdown(custom_css, unsafe_allow_html=True)

# --- ARCHIVO DE PERSISTENCIA ---
CSV_FILE = "catalogo_materiales.csv"

# LISTA CON DESGLOSE DETALLADO POR DEFECTO
DEFAULT_DATA = [
    {"ID": "LP01", "Nombre": "Tulipán 4 pétalos (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 0.40, "Tiempo (min)": 15, "Descripción": "Tiempos: Capullo 10m, hojas 3m, armado 2m"},
    {"ID": "LP02", "Nombre": "Tulipán 6 pétalos (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 0.50, "Tiempo (min)": 20, "Descripción": "Tiempos: Capullo 12m, hojas 5m, armado 3m"},
    {"ID": "LP03", "Nombre": "Girasol Pequeño (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 0.90, "Tiempo (min)": 25, "Descripción": "Centro café, pétalos amarillos"},
    {"ID": "LP06", "Nombre": "Snoopy (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 0.97, "Tiempo (min)": 26, "Descripción": "Mat: 18 limpiapipas (0.90), perla (0.07). Tiempos: Capullo 10m, detalles 7m, hojas 3m, armado 6m"},
    {"ID": "LP08", "Nombre": "Manzanilla / Margarita (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 0.30, "Tiempo (min)": 5, "Descripción": "Tiempos: Pétalos/centro 3m, armado 2m"},
    {"ID": "LP07", "Nombre": "Coneja (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 1.40, "Tiempo (min)": 22, "Descripción": "Detalles faciales y vestimenta base"},
    {"ID": "LP09", "Nombre": "Lirio (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 0.50, "Tiempo (min)": 20, "Descripción": "Armado de estambre y pétalos triples"},
    
    {"ID": "CR01", "Nombre": "Rosa Tejida (Crochet)", "Categoría": "Crochet", "Costo Material (S/)": 1.20, "Tiempo (min)": 45, "Descripción": "Hilo algodón, relleno, palito"},
    {"ID": "CR02", "Nombre": "Tulipán (Crochet)", "Categoría": "Crochet", "Costo Material (S/)": 0.80, "Tiempo (min)": 30, "Descripción": "Tejido estándar en hilo industrial"},
    
    {"ID": "AM01", "Nombre": "Abejita Amigurumi", "Categoría": "Amigurumis", "Costo Material (S/)": 2.10, "Tiempo (min)": 60, "Descripción": "Tejido completo, ojos de seguridad, bordado"},
    {"ID": "AM02", "Nombre": "Snoopy Amigurumi", "Categoría": "Amigurumis", "Costo Material (S/)": 2.25, "Tiempo (min)": 60, "Descripción": "Tejido completo, ojos de seguridad, bordado"},
    {"ID": "AM03", "Nombre": "Shrek Amigurumi", "Categoría": "Amigurumis", "Costo Material (S/)": 2.25, "Tiempo (min)": 60, "Descripción": "Tejido completo, detalles en fieltro/bordado"},
    {"ID": "AM04", "Nombre": "Pollito Amigurumi", "Categoría": "Amigurumis", "Costo Material (S/)": 2.25, "Tiempo (min)": 60, "Descripción": "Tejido completo, detalles en pico y patitas"},
    {"ID": "AM05", "Nombre": "Cristiano Amigurumi", "Categoría": "Amigurumis", "Costo Material (S/)": 2.25, "Tiempo (min)": 60, "Descripción": "Tejido personalizado con camiseta y detalles"},

    {"ID": "INS01", "Nombre": "Alambre", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.20, "Tiempo (min)": 0, "Descripción": "Soporte de tallo"},
    {"ID": "INS02", "Nombre": "Base", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.70, "Tiempo (min)": 0, "Descripción": "Estructura de ramo"},
    {"ID": "INS03", "Nombre": "Biruta", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 1.20, "Tiempo (min)": 0, "Descripción": "Relleno protector"},
    {"ID": "INS04", "Nombre": "Blonda", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.80, "Tiempo (min)": 0, "Descripción": "Decoración de encaje"},
    {"ID": "INS05", "Nombre": "Bolsa/Empaque", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 2.00, "Tiempo (min)": 0, "Descripción": "Presentación final"},
    {"ID": "INS06", "Nombre": "Brochetas", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.04, "Tiempo (min)": 0, "Descripción": "Palitos de fijación"},
    {"ID": "INS07", "Nombre": "Caja", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 5.00, "Tiempo (min)": 0, "Descripción": "Caja de regalo rígida"},
    {"ID": "INS08", "Nombre": "Cinta adhesiva", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.50, "Tiempo (min)": 0, "Descripción": "Consumible de pegado"},
    {"ID": "INS09", "Nombre": "Cinta gruesa/grande", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.50, "Tiempo (min)": 0, "Descripción": "Sujeción estructural"},
    {"ID": "INS10", "Nombre": "Cinta satinada", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.50, "Tiempo (min)": 0, "Descripción": "Lazo exterior decorativo"},
    {"ID": "INS11", "Nombre": "Cinta de caja", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.75, "Tiempo (min)": 0, "Descripción": "Sellado de seguridad"},
    {"ID": "INS12", "Nombre": "Dulce", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 2.00, "Tiempo (min)": 0, "Descripción": "Complemento opcional"},
    {"ID": "INS13", "Nombre": "Floratei", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.20, "Tiempo (min)": 0, "Descripción": "Cinta floral verde"},
    {"ID": "INS14", "Nombre": "Ganchito", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.33, "Tiempo (min)": 0, "Descripción": "Sostén de tarjetas"},
    {"ID": "INS15", "Nombre": "Limpiapipas (Insumo)", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.05, "Tiempo (min)": 0, "Descripción": "Insumo extra por unidad"},
    {"ID": "INS16", "Nombre": "Tarjeta dedicatoria", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.56, "Tiempo (min)": 0, "Descripción": "Impresión en couché"},
    {"ID": "INS17", "Nombre": "Tarjeta dulce", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.56, "Tiempo (min)": 0, "Descripción": "Etiqueta temática"},
    {"ID": "INS18", "Nombre": "Tarjeta hang tag", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.56, "Tiempo (min)": 0, "Descripción": "Etiqueta colgante de marca"},
    {"ID": "INS19", "Nombre": "Tarjeta mensaje", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.56, "Tiempo (min)": 0, "Descripción": "Tarjeta plegable mini"},
    {"ID": "INS20", "Nombre": "Uso", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.50, "Tiempo (min)": 0, "Descripción": "Desgaste de herramientas"},
    {"ID": "INS21", "Nombre": "Perlitas", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.06, "Tiempo (min)": 0, "Descripción": "Acentuación visual"},
    {"ID": "INS22", "Nombre": "Papel Coreano", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.40, "Tiempo (min)": 0, "Descripción": "Pliego de envoltura impermeable"},
    {"ID": "INS23", "Nombre": "Papel Leche", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.92, "Tiempo (min)": 0, "Descripción": "Pliego de envoltura mate premium"},
]

# --- CARGA Y SANITIZACIÓN DE DATOS (CORRECCIÓN DE ERROR DE TIPO) ---
def load_and_fix_catalog():
    if os.path.exists(CSV_FILE):
        try:
            df = pd.read_csv(CSV_FILE)
            # 1. Asegurar columna Descripción
            if "Descripción" not in df.columns:
                df["Descripción"] = ""
            
            # 2. SANITIZACIÓN CLAVE: Convertir la columna 'Descripción' estrictamente a string/texto
            # Esto evita el StreamlitAPIException "not compatible for editing underlying data type FLOAT"
            df["Descripción"] = df["Descripción"].fillna("").astype(str)
            df["Nombre"] = df["Nombre"].fillna("").astype(str)
            df["Categoría"] = df["Categoría"].fillna("Empaque / Ensamble").astype(str)
            df["ID"] = df["ID"].fillna("GEN").astype(str)
            df["Costo Material (S/)"] = pd.to_numeric(df["Costo Material (S/)"], errors="coerce").fillna(0.0)
            df["Tiempo (min)"] = pd.to_numeric(df["Tiempo (min)"], errors="coerce").fillna(0).astype(int)
            
            return df
        except Exception:
            df = pd.DataFrame(DEFAULT_DATA)
            df["Descripción"] = df["Descripción"].astype(str)
            return df
    else:
        df = pd.DataFrame(DEFAULT_DATA)
        df["Descripción"] = df["Descripción"].astype(str)
        df.to_csv(CSV_FILE, index=False)
        return df

def save_catalog(df):
    # Forzar sanitización antes de guardar
    df["Descripción"] = df["Descripción"].fillna("").astype(str)
    df.to_csv(CSV_FILE, index=False)
    st.session_state.catalog = df

# --- INICIALIZACIÓN DE ESTADO ---
if "catalog" not in st.session_state:
    st.session_state.catalog = load_and_fix_catalog()

if "cart" not in st.session_state:
    st.session_state.cart = {}

if "insumos_seleccionados" not in st.session_state:
    st.session_state.insumos_seleccionados = {}

# --- HEADER PRINCIPAL ---
st.markdown("""
<div class="main-header">
    <h1>🌸 Cotizador de Pedidos</h1>
    <p>Gestión inteligente de costos, mano de obra y proformas para taller artesanal</p>
</div>
""", unsafe_allow_html=True)

# --- PANEL LATERAL DE CONFIGURACIÓN ---
with st.sidebar:
    st.header("⚙️ Parámetros de Taller")
    st.caption("Ajusta los valores para el cálculo en tiempo real.")
    
    with st.container(border=True):
        st.subheader("💼 Mano de Obra")
        costo_hora_mo = st.number_input(
            "Valor Hora Trabajo (S/)",
            min_value=0.0,
            value=6.0,
            step=0.5,
            help="Sueldo por hora calculado para el artesano"
        )
        
        st.subheader("📈 Margen de Ganancia")
        factor_ganancia = st.slider(
            "Multiplicador de Valor",
            min_value=1.0,
            max_value=3.0,
            value=1.35,
            step=0.05,
            help="1.30 equivale a un 30% de margen comercial sobre costos"
        )

    with st.container(border=True):
        st.subheader("⏱️ Ensamble General")
        tiempo_ensamble = st.number_input(
            "Empaque y Arreglo (min)",
            min_value=0,
            value=120,
            step=5,
            help="Tiempo estimado para armado de base, envoltorio y lazo"
        )

    st.divider()
    st.caption("✨ *Sistema de Cotización Artesanal v1.0*")

# --- PESTAÑAS PRINCIPALES ---
tab_builder, tab_insumos, tab_catalog = st.tabs([
    "💐 1. Armar Composición / Cotizar", 
    "📦 2. Seleccionar Insumos y Empaque", 
    "🗃️ 3. Catálogo de Recetas y Costos"
])

# ==============================================================================
# TAB 1: ARMAR RAMO & RESUMEN
# ==============================================================================
with tab_builder:
    col_builder, col_summary = st.columns([1.25, 1], gap="medium")
    
    with col_builder:
        st.subheader("Añadir Piezas al Ramo")
        
        # Filtrar solo elementos principales (excluir insumos)
        df_flores = st.session_state.catalog[st.session_state.catalog["Categoría"] != "Empaque / Ensamble"]
        
        c_item, c_qty, c_btn = st.columns([3, 1.2, 1.2], vertical_alignment="bottom")
        with c_item:
            selected_item_name = st.selectbox(
                "Pieza o Flor:",
                options=df_flores["Nombre"].tolist(),
                index=0
            )
        with c_qty:
            cantidad = st.number_input("Cantidad:", min_value=1, value=1, step=1)
        with c_btn:
            if st.button("➕ Añadir", use_container_width=True, type="primary"):
                if selected_item_name in st.session_state.cart:
                    st.session_state.cart[selected_item_name] += cantidad
                else:
                    st.session_state.cart[selected_item_name] = cantidad
                st.toast(f"Añadido: {cantidad}x {selected_item_name}", icon="✅")

        st.divider()
        st.subheader("🛒 Resumen de Elementos Agregados")
        
        cart_data = []
        cm_flores = 0.0
        tiempo_flores_min = 0
        
        # 1. Procesar flores en carrito
        for item_name, qty in list(st.session_state.cart.items()):
            item_match = st.session_state.catalog[st.session_state.catalog["Nombre"] == item_name]
            if not item_match.empty:
                precio_unitario = float(item_match.iloc[0]["Costo Material (S/)"])
                tiempo_unitario = int(item_match.iloc[0]["Tiempo (min)"])
                descripcion = str(item_match.iloc[0]["Descripción"])
                
                cm_subtotal = precio_unitario * qty
                t_subtotal = tiempo_unitario * qty
                cm_flores += cm_subtotal
                tiempo_flores_min += t_subtotal
                
                cart_data.append({
                    "Categoría": "🌸 Pieza",
                    "Elemento": item_name,
                    "Cant.": int(qty),
                    "Costo Mat.": f"S/ {cm_subtotal:.2f}",
                    "Tiempo Total": f"{t_subtotal} min",
                    "Receta / Detalles": descripcion
                })
        
        # 2. Procesar insumos en carrito
        cm_insumos = 0.0
        for insumo_name, qty in st.session_state.insumos_seleccionados.items():
            if qty > 0:
                item_match = st.session_state.catalog[st.session_state.catalog["Nombre"] == insumo_name]
                if not item_match.empty:
                    precio_unitario = float(item_match.iloc[0]["Costo Material (S/)"])
                    cm_subtotal = precio_unitario * qty
                    cm_insumos += cm_subtotal
                    
                    cart_data.append({
                        "Categoría": "📦 Insumo",
                        "Elemento": insumo_name,
                        "Cant.": int(qty),
                        "Costo Mat.": f"S/ {cm_subtotal:.2f}",
                        "Tiempo Total": "-",
                        "Receta / Detalles": "Empaque / Armado"
                    })

        if not cart_data:
            st.info("El pedido está actualmente vacío. Selecciona flores arriba o insumos en la pestaña 2.")
        else:
            df_cart = pd.DataFrame(cart_data)
            st.dataframe(df_cart, use_container_width=True, hide_index=True)
            
            c_clear, _ = st.columns([1.5, 3])
            with c_clear:
                if st.button("🗑️ Vaciar Todo el Pedido", use_container_width=True):
                    st.session_state.cart = {}
                    st.session_state.insumos_seleccionados = {}
                    st.rerun()

    with col_summary:
        st.subheader("📊 Métricas Financieras")
        
        # Cálculos Consolidados
        cm_total = cm_flores + cm_insumos
        tiempo_total_min = tiempo_flores_min + tiempo_ensamble
        horas_totales = tiempo_total_min / 60.0
        mo_total = horas_totales * costo_hora_mo
        costo_base = cm_total + mo_total
        precio_final = costo_base * factor_ganancia
        ganancia_neta = precio_final - costo_base

        # Render de Tarjetas KPI
        k1, k2 = st.columns(2)
        with k1:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Costo Materiales</div>
                <div class="kpi-value">S/ {cm_total:.2f}</div>
                <div class="kpi-sub" style="color:#666;">Flores: S/ {cm_flores:.2f} | Insumos: S/ {cm_insumos:.2f}</div>
            </div>
            """, unsafe_allow_html=True)
        with k2:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Tiempo Trabajo</div>
                <div class="kpi-value">{horas_totales:.1f} hrs</div>
                <div class="kpi-sub" style="color:#666;">Total: {tiempo_total_min} minutos</div>
            </div>
            """, unsafe_allow_html=True)
            
        st.write("")
        k3, k4 = st.columns(2)
        with k3:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Mano de Obra</div>
                <div class="kpi-value">S/ {mo_total:.2f}</div>
                <div class="kpi-sub" style="color:#666;">Costo Base: S/ {costo_base:.2f}</div>
            </div>
            """, unsafe_allow_html=True)
        with k4:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Margen Neto</div>
                <div class="kpi-value" style="color:#2e7d32;">S/ {ganancia_neta:.2f}</div>
                <div class="kpi-sub">Ganancia limpia del taller</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown(f"""
        <div class="price-hero">
            <div class="price-hero-title">Precio Sugerido al Cliente</div>
            <div class="price-hero-value">S/ {precio_final:.2f}</div>
        </div>
        """, unsafe_allow_html=True)

        st.divider()
        st.subheader("📲 Exportar Proforma de Cliente")
        
        col_c1, col_c2 = st.columns(2)
        with col_c1:
            nombre_cliente = st.text_input("Cliente:", value="Cliente")
        with col_c2:
            nombre_ramo = st.text_input("Concepto / Ramo:", value="Ramo Personalizado")
            
        # GENERACIÓN DE TEXTO LIMPIO (Exclusivo para el cliente)
        resumen_txt = f"*COTIZACIÓN - {nombre_ramo.upper()}*\n"
        resumen_txt += f"👤 *Cliente:* {nombre_cliente}\n"
        resumen_txt += "-----------------------------------\n"
        resumen_txt += "*Flores y Piezas:*\n"
        
        if st.session_state.cart:
            for item_name, qty in st.session_state.cart.items():
                resumen_txt += f"• {qty}x {item_name}\n"
        else:
            resumen_txt += "• Sin piezas seleccionadas\n"
            
        resumen_txt += "-----------------------------------\n"
        resumen_txt += f"💰 *PRECIO TOTAL:* *S/ {precio_final:.2f}*\n\n"
        resumen_txt += "¡Gracias por valorar el trabajo artesanal! 🌸✨"

        st.text_area("Ficha de texto (Vista previa):", value=resumen_txt, height=180)
        
        encoded_message = urllib.parse.quote(resumen_txt)
        ws_url = f"https://api.whatsapp.com/send?text={encoded_message}"
        
        st.link_button("📲 Enviar Cotización por WhatsApp", ws_url, use_container_width=True, type="primary")

# ==============================================================================
# TAB 2: SELECCIÓN DE INSUMOS DE ARMADO
# ==============================================================================
with tab_insumos:
    st.subheader("📦 Selección Rápida de Insumos de Envoltura y Ensamble")
    st.caption("Selecciona las cantidades requeridas para este pedido. Los costos se acumulan de inmediato al análisis financiero.")
    
    df_insumos = st.session_state.catalog[st.session_state.catalog["Categoría"] == "Empaque / Ensamble"]
    
    # Buscador de insumos
    busqueda_insumo = st.text_input("🔍 Buscar Insumo:", "", placeholder="Ej. Papel, Cinta, Caja...")
    if busqueda_insumo:
        df_insumos = df_insumos[df_insumos["Nombre"].str.contains(busqueda_insumo, case=False, na=False)]
        
    insumos_list = df_insumos.to_dict("records")
    
    cols_per_row = 4
    for i in range(0, len(insumos_list), cols_per_row):
        row_items = insumos_list[i:i + cols_per_row]
        cols = st.columns(cols_per_row)
        
        for idx, item in enumerate(row_items):
            nombre = item["Nombre"]
            precio_unitario = float(item["Costo Material (S/)"])
            cant_actual = int(st.session_state.insumos_seleccionados.get(nombre, 0))
            subtotal = cant_actual * precio_unitario
            
            with cols[idx]:
                with st.container(border=True):
                    st.markdown(f"**{nombre}**")
                    st.caption(f"Costo: **S/ {precio_unitario:.2f}** c/u")
                    
                    new_qty = st.number_input(
                        "Cantidad:",
                        min_value=0,
                        value=cant_actual,
                        step=1,
                        key=f"insumo_qty_{item['ID']}"
                    )
                    st.session_state.insumos_seleccionados[nombre] = new_qty
                    
                    if new_qty > 0:
                        st.markdown(f"<span style='color:#2e7d32; font-weight:600;'>Subtotal: S/ {subtotal:.2f}</span>", unsafe_allow_html=True)

# ==============================================================================
# TAB 3: CATÁLOGO DE PRECIOS Y EDICIÓN
# ==============================================================================
with tab_catalog:
    st.subheader("🗃️ Gestor de Recetas, Tiempos y Costos Unitarios")
    st.caption("Edita los valores directamente en la tabla. Agrega detalles de sub-tiempos o lista de materiales en la columna **'Descripción'**.")
    
    # Forzar que la columna Descripción sea string en el dataframe actual antes del editor
    st.session_state.catalog["Descripción"] = st.session_state.catalog["Descripción"].fillna("").astype(str)
    
    edited_df = st.data_editor(
        st.session_state.catalog,
        num_rows="dynamic",
        use_container_width=True,
        hide_index=True,
        column_config={
            "ID": st.column_config.TextColumn("Código ID", width="small", required=True),
            "Nombre": st.column_config.TextColumn("Nombre de Elemento", width="medium", required=True),
            "Categoría": st.column_config.SelectboxColumn(
                "Categoría",
                options=["Crochet", "Limpiapipas", "Amigurumis", "Empaque / Ensamble"],
                width="medium",
                required=True
            ),
            "Costo Material (S/)": st.column_config.NumberColumn("Costo Físico (S/)", min_value=0.0, format="S/ %.2f", required=True),
            "Tiempo (min)": st.column_config.NumberColumn("Tiempo Elaboración (min)", min_value=0, format="%d min", required=True),
            "Descripción": st.column_config.TextColumn("Descripción / Desglose de Receta (BOM)", width="large")
        }
    )
    
    col_save, _ = st.columns([1.5, 3])
    with col_save:
        if st.button("💾 Guardar Cambios en Base de Datos", type="primary", use_container_width=True):
            save_catalog(edited_df)
            st.success("¡Base de datos y recetas actualizadas correctamente!")
            st.rerun()