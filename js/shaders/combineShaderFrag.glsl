
      uniform sampler2D cameraTexture;
      uniform sampler2D tDiffuse; // Scene contents 
      uniform sampler2D bloomTexture;
      uniform vec2 u_resolutionRatio;
      uniform bool useAdditiveBlend;
      
      varying vec2 vUv;
      
      vec4 normalBlend(vec4 x, vec4 y, float opacity) {
      return y * opacity + x * (1.0 - opacity);
      }
      
      void main(void) {
        vec4 cameraColor = texture2D( cameraTexture, vUv);
        vec4 sceneColor = texture2D( tDiffuse, vUv);
        vec4 bloomColor = texture2D( bloomTexture, vUv);
      
        gl_FragColor = normalBlend(cameraColor, sceneColor, sceneColor.a);
        gl_FragColor += bloomColor;
        // gl_FragColor = vec4(length(cameraColor.rgb), length(bloomColor.rgb), length(sceneColor.rgb), 1.); // Shows camera in red and scene in blue
      }