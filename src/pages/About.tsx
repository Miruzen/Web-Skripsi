import { ExternalLink, BookOpen, Target, Cpu, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import authorPhoto from "@/assets/author-photo.png";
import projectKao from "@/assets/project-kao.png";
import projectGold from "@/assets/project-gold.png";
import projectGhost from "@/assets/project-ghost.png";
import logoWordPress from "@/assets/logo-wordpress.png";
import logoPython from "@/assets/logo-python.png";
import logoTypeScript from "@/assets/logo-typescript.png";
import { useEffect, useState } from "react";

const About = () => {
  const [lineHeight, setLineHeight] = useState(0);
  
  useEffect(() => {
    // Animate the line drawing from top to bottom
    const timer = setTimeout(() => {
      setLineHeight(100);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const education = [
    { title: "SD Kalam Kudus", year: "2010-2016" },
    { title: "Sekolah Menengah Poilam Suwa Malaysia", year: "2016-2022" },
    { title: "Universitas Tarumanagara", year: "2022-Present" },
    { title: "Entrepreneur", year: "2024-Present" },
  ];

  const techSkills = [
    { name: "TypeScript", logo: logoTypeScript, color: "#3178C6" },
    { name: "Python", logo: logoPython, color: "#3776AB" },
    { name: "WordPress", logo: logoWordPress, color: "#21759B" },
  ];

  const projects = [
    {
      name: "Kao Beauty Clinic",
      url: "https://kaobeautyclinic.com",
      image: projectKao,
      description: "Aesthetic & Beauty Clinic Website",
    },
    {
      name: "Gold Advertising",
      url: "https://goldadvertising.id",
      image: projectGold,
      description: "Neon Sign Creative Agency",
    },
    {
      name: "Ghost PC Components",
      url: "https://website-koferry.vercel.app",
      image: projectGhost,
      description: "E-commerce Platform",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* About Application Section */}
      <section className="container mx-auto px-6 py-16 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Tentang Aplikasi
            </h1>
            <p className="text-lg text-muted-foreground">
              Sistem Prediksi EUR/USD dengan Analisis Sentimen & Teknikal
            </p>
          </div>

          {/* Purpose Card */}
          <Card className="p-8 mb-6 bg-card/50 backdrop-blur border-border animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Tujuan Pengembangan</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Aplikasi ini dikembangkan sebagai bagian dari tugas akhir untuk memenuhi syarat kesarjanaan Strata 1 (S1). 
                  Latar belakang pembuatan aplikasi ini adalah adanya <span className="text-primary font-medium">kebutuhan informasi dan tools</span> yang 
                  dapat memprediksi pergerakan mata uang Forex berdasarkan analisis sentimen dan teknikal secara bersamaan.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Pasangan mata uang <span className="text-primary font-medium">EUR/USD</span> dipilih karena kontribusinya yang sangat signifikan 
                  dalam pasar pertukaran global, yaitu sekitar <span className="text-primary font-medium">30-40%</span> dari total volume perdagangan mata uang dunia.
                </p>
              </div>
            </div>
          </Card>

          {/* Methodology Card */}
          <Card className="p-8 mb-6 bg-card/50 backdrop-blur border-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Metodologi & Teknologi</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-medium">Analisis Teknikal:</span> Menggunakan algoritma 
                      <span className="text-primary font-medium"> Moving Average (EMA)</span> untuk mengidentifikasi tren harga historis.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-medium">Analisis Sentimen:</span> Menggunakan model 
                      <span className="text-primary font-medium"> FinBERT-LSIMF</span>, yang merupakan kombinasi dari FinBERT dan LongFormer, 
                      untuk menganalisis teks berita dan menghasilkan skor sentimen.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-medium">Model Prediksi:</span> Data teknikal dan sentimen digabungkan menggunakan 
                      <span className="text-primary font-medium"> LSTM (Long Short-Term Memory)</span> dengan arsitektur 3 layer, 
                      dilengkapi dengan <span className="text-primary font-medium">dropout</span> untuk mencegah overfitting, 
                      dan dense layer dengan output tunggal untuk prediksi harga.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* How to Use Card */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-3">Cara Penggunaan</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Panduan lengkap penggunaan aplikasi dapat ditemukan pada halaman <span className="text-primary font-medium">Analisis</span>. 
                  Di sana Anda dapat memasukkan data historis, melakukan analisis sentimen berita, dan mendapatkan prediksi harga.
                </p>
                <Link 
                  to="/analysis" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Mulai Analisis <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto border-t border-border/50" />
      </div>

      {/* Header Section - Developer */}
      <section className="container mx-auto px-6 py-16 animate-fade-in">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="relative animate-scale-in">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-50 animate-pulse" />
            <img
              src={authorPhoto}
              alt="Nanda Goaw Putra"
              className="relative w-48 h-48 rounded-full object-cover border-4 border-primary shadow-glow"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Nanda Goaw Putra 
            </h1>
            <p className="text-xl text-muted-foreground">
              Undegraduate Student | Entrepreneur
            </p>
          </div>
        </div>
      </section>

      {/* Education Tree Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground animate-fade-in">
          Growth Journey
        </h2>
        <div className="max-w-3xl mx-auto relative">
          {/* Animated vertical line that draws from top to bottom */}
          <div 
            className="absolute left-1/2 top-0 w-1 -translate-x-1/2 bg-gradient-to-b from-primary via-accent to-primary transition-all duration-[2000ms] ease-out" 
            style={{ 
              height: `${lineHeight}%`,
              backgroundImage: 'repeating-linear-gradient(0deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 10px, transparent 10px, transparent 20px)' 
            }} 
          />
          
          {education.map((item, index) => (
            <div
              key={index}
              className={`relative flex items-center gap-8 mb-16 animate-fade-in ${
                index % 2 === 0 ? "flex-row" : "flex-row-reverse"
              }`}
              style={{ animationDelay: `${0.5 + index * 0.3}s` }}
            >
              {/* Content Card */}
              <div className={`flex-1 ${index % 2 === 0 ? "text-right" : "text-left"}`}>
                <Card className="p-6 bg-card/50 backdrop-blur border-border hover:shadow-glow transition-all hover:scale-105">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.year}</p>
                </Card>
              </div>

              {/* Glowing Dot */}
              <div className="relative z-10">
                <div className="w-6 h-6 rounded-full bg-primary shadow-glow animate-pulse" />
                <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary animate-ping opacity-75" />
              </div>

              {/* Empty space for alternating layout */}
              <div className="flex-1" />
            </div>
          ))}
        </div>
      </section>

      {/* Tech Skills Carousel */}
      <section className="container mx-auto px-6 py-20 overflow-hidden animate-fade-in">
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
          Tech Stack
        </h2>
        <div className="relative">
          <div className="flex gap-8 animate-scroll">
            {[...techSkills, ...techSkills, ...techSkills].map((skill, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-48 h-48 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-4 hover:shadow-glow transition-all hover:scale-110"
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg p-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${skill.color}22, ${skill.color}44)`,
                    boxShadow: `0 0 30px ${skill.color}44`
                  }}
                >
                  <img src={skill.logo} alt={skill.name} className="w-full h-full object-contain" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {skill.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground animate-fade-in">
          Featured Projects
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <Card
              key={index}
              className="overflow-hidden bg-card/50 backdrop-blur border-border hover:shadow-glow transition-all hover:scale-105 animate-fade-in group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold"
                  >
                    Visit Site <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {project.name}
                </h3>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <p className="text-2xl text-muted-foreground">
          Crafting Ideas into Digital Reality ✨
        </p>
      </section>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default About;
